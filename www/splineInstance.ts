/*
   Copyright 2021 Alexander Efremkin

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { Spline, Point } from './spline';
import * as PIXI from 'pixi.js';

class SplineUniforms {
    fCycle = 0.;
    clStart = [1., 0., 0.];
    clEnd = [1., 1., 0];
}


class SplineInstance {
    spline?: Spline;
    mesh?: PIXI.Mesh<PIXI.Shader>;
    shader: PIXI.Shader;
    uniforms: SplineUniforms;
    spStart: number;
    spEnd: number;

    // maps vertex index to its time - this helps with drawing only a part of the line
    timeIndices: number[];

    // changes to spline do not immediately cause mesh to be rebuilt, because
    // renderer may still reference it. Instead, this flag  is set,
    // and rebuild is called from animation loop
    needsRebuild: boolean;

    constructor(program: PIXI.Program, spline?: Spline, uniforms?: SplineUniforms) {
        this.spline = spline;
        if (uniforms) this.uniforms = uniforms;
        else this.uniforms = new SplineUniforms()
        this.shader = new PIXI.Shader(program, this.uniforms)

        this.needsRebuild = true
        this.spStart = 0.
        this.spEnd = 1.
        this.timeIndices = []
    }

    private pointsToMeshStrip(pts: Point[], spline_time: number): PIXI.Geometry {
        const width = 2.0 * (devicePixelRatio || 1.0);

        // using new Array in theory preallocates an array to a certain size
        // This has the inconveniency that we cannot "push" to array but must
        // use precise indices
        // Every vertex and UV has "x1, y1, x2, y2" numbers per every point
        let verts: number[] = new Array(pts.length * 4);
        let uvs: number[] = new Array(pts.length * 4);
        this.timeIndices = new Array(pts.length);

        if (pts.length == 1) {
            // draw a square
            verts = [
                pts[0].x - width, pts[0].y - width,
                pts[0].x - width, pts[0].y + width,
                pts[0].x + width, pts[0].y - width,
                pts[0].x + width, pts[0].y + width,
            ]
            uvs = [0, 0, 0, 1, 1, 0, 1, 1]
            this.timeIndices = [0, 1];
        } else {
            // Build a uniform-width "tunnel" along the line
            // Find tangents at segment points
            const tangents = pts.map((pt, index) => {
                if (index == 0) return Math.atan2(pts[index + 1].y - pt.y, pts[index + 1].x - pt.x)
                else if (index == pts.length - 1) return Math.atan2(pt.y - pts[index - 1].y, pt.x - pts[index - 1].x)
                // average the two -- better to use weighted average by length though
                return 0.5 * (
                    Math.atan2(pts[index + 1].y - pt.y, pts[index + 1].x - pt.x) +
                    Math.atan2(pt.y - pts[index - 1].y, pt.x - pts[index - 1].x))
            })
            // create tunnel vertices (a pair of them per every line point)
            lineSegment(pts, tangents, verts)
            pts.forEach((pt, index) => {
                const uv_x = index / (pts.length - 1)
                const uv_y = pt.t / spline_time
                uvs[index * 4 + 0] = uv_x
                uvs[index * 4 + 1] = uv_y
                uvs[index * 4 + 2] = uv_x
                uvs[index * 4 + 3] = uv_y
                this.timeIndices[index] = uv_y
            })
        }

        const geom = new PIXI.Geometry()
        geom.addAttribute('aVertexPosition', verts)
        geom.addAttribute('aUv', uvs)

        return geom
    }

    updateSpline(spline: Spline) {
        this.spline = spline;
        this.needsRebuild = true;
    }

    setColours(clStart: number[], clEnd: number[]) {
        this.uniforms.clStart = clStart
        this.uniforms.clEnd = clEnd

        if (this.mesh) {
            this.mesh.shader.uniforms.clStart = this.uniforms.clStart
            this.mesh.shader.uniforms.clEnd = this.uniforms.clEnd
        }
    }

    setCycle(fCycle: number) {
        this.uniforms.fCycle = fCycle

        if (this.mesh) {
            this.mesh.shader.uniforms.fCycle = this.uniforms.fCycle
        }
    }

    setSplinePart(fStart: number, fEnd: number) {
        this.spStart = fStart
        this.spEnd = fEnd
    }

    rebuild() {
        if (!this.needsRebuild || !this.spline)
            return

        if (this.mesh)
            this.mesh.destroy()
        this.mesh = new PIXI.Mesh(
            this.pointsToMeshStrip(this.spline.subInterval(0., 1.), this.spline.time),
            this.shader,
            PIXI.State.for2d(),
            PIXI.DRAW_MODES.TRIANGLE_STRIP)

        this.needsRebuild = false
    }

    /// Find vertex index at a specified time point
    private findTimeIndex(time: number): number {
        if (time <= 0) return 0;
        else if (time >= 1.) return this.timeIndices.length - 1;

        // we start from an approximate point, which is much faster than plain linear search
        let index = Math.round(time * this.timeIndices.length)
        while (index > 0 && this.timeIndices[index] >= time) {
            index--
        }
        if (index == 0 && this.timeIndices[index] >= time) {
            return index
        }
        while (index < this.timeIndices.length-1 && this.timeIndices[index] < time) {
            index++
        }
        return index
    }

    render() {
        if (!this.mesh)
            return
        // convert start and end times to vertex offsets
        let vxStart: number = 0
        let vxEnd: number = -1  // special value for "all"
        if (this.timeIndices) {
            vxStart = this.findTimeIndex(this.spStart)
            vxEnd = this.findTimeIndex(this.spEnd)
        }
        if (vxStart == -1) {
            // there was no start index found - it is likely beyond end, and so nothing should be drawn
            return 
        }
        if (vxStart == vxEnd) {
            // same point - do not draw anything
            return
        }

        this.mesh.start = vxStart * 2
        this.mesh.size = (vxEnd - vxStart) * 2
    }

    isRenderable(): boolean {
        return (this.spline !== undefined)
    }

    reset() {
        this.spline = undefined
        this.mesh = undefined
    }

}

/////////////////////////////////
// Utilities
/////////////////////////////////

function lineSegment(ends: Point[], tangents: number[], verts: number[]) {
    const width = 2.0 * (devicePixelRatio || 1.0);
    ends.forEach((pt, index) => {
        const sink = Math.sin(-tangents[index])
        const cosk = Math.cos(-tangents[index])
        verts[index * 4 + 0] = pt.x - width * sink
        verts[index * 4 + 1] = pt.y - width * cosk
        verts[index * 4 + 2] = pt.x + width * sink
        verts[index * 4 + 3] = pt.y + width * cosk
    })
}



export { SplineInstance, SplineUniforms }