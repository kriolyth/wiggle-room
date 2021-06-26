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

    clone(): SplineUniforms {
        let result = new SplineUniforms()
        result.fCycle = this.fCycle
        result.clStart = this.clStart
        result.clEnd = this.clEnd

        return result
    }
}


class SplineInstance {
    spline?: Spline;
    mesh?: PIXI.Mesh<PIXI.Shader>;
    shader: PIXI.Shader;
    uniforms: SplineUniforms;
    needsRebuild: boolean;

    constructor(program: PIXI.Program, spline?: Spline, uniforms?: SplineUniforms) {
        this.spline = spline;
        if (uniforms) this.uniforms = uniforms;
        else this.uniforms = new SplineUniforms()
        this.shader = new PIXI.Shader(program, this.uniforms)

        this.needsRebuild = true;
    }

    updateSpline(spline: Spline) {
        // if (this.mesh) {
        //     const geometry = pointsToMeshStrip(spline.subInterval(0., 1.), spline.time)
        //     this.mesh.verticesBuffer.update(geometry.getBuffer('aVertexPosition').data)
        //     this.mesh.uvBuffer.update(geometry.getBuffer('aUv').data)
        //     this.mesh.indices = new Uint16Array(geometry.getIndex().data)
        // } else 
        this.spline = spline;
        this.needsRebuild = true;
    }

    updateUniforms(uniforms: SplineUniforms) {
        this.uniforms.fCycle = uniforms.fCycle
        this.uniforms.clStart = uniforms.clStart
        this.uniforms.clEnd = uniforms.clEnd

        if (this.mesh) {
            this.mesh.shader.uniforms.fCycle = this.uniforms.fCycle
            this.mesh.shader.uniforms.clStart = this.uniforms.clStart
            this.mesh.shader.uniforms.clEnd = this.uniforms.clEnd
        }
    }

    rebuild() {
        if (!this.needsRebuild || !this.spline)
            return

        this.mesh = new PIXI.Mesh(
            pointsToMeshStrip(this.spline.subInterval(0., 1.), this.spline.time),
            this.shader,
            PIXI.State.for2d(),
            PIXI.DRAW_MODES.TRIANGLE_STRIP)
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
    const width = 2.0;
    ends.forEach((pt, index) => {
        const sink = Math.sin(-tangents[index])
        const cosk = Math.cos(-tangents[index])
        verts.push(
            pt.x - width * sink, pt.y - width * cosk,
            pt.x + width * sink, pt.y + width * cosk,
        );
    })
}

function pointsToMeshStrip(pts: Point[], spline_time: number): PIXI.Geometry {
    const width = 1.0;
    let verts: number[] = [];
    let uvs: number[] = [];
    let indices: number[] = [];
    if (pts.length == 1) {
        // draw a square
        verts = [
            pts[0].x - width, pts[0].y - width,
            pts[0].x - width, pts[0].y + width,
            pts[0].x + width, pts[0].y - width,
            pts[0].x + width, pts[0].y + width,
        ]
        uvs = [0, 0, 0, 1, 1, 0, 1, 1]
        indices = [0, 1, 2, 3]
    } else {
        // Build a uniform-width "tunnel" along the line
        // Find tangents at segment points
        const tangents = pts.map((pt, index) => {
            if (index == 0) return Math.atan2(pts[index + 1].y - pt.y, pts[index + 1].x - pt.x)
            else if (index == pts.length - 1) return Math.atan2(pt.y - pts[index - 1].y, pt.x - pts[index - 1].x)
            // average the two -- better to use weighted average by length though
            return 0.5 * (Math.atan2(pts[index + 1].y - pt.y, pts[index + 1].x - pt.x) + Math.atan2(pt.y - pts[index - 1].y, pt.x - pts[index - 1].x))
        })
        // create tunnel vertices (a pair of them per every line point)
        lineSegment(pts, tangents, verts)
        pts.forEach((pt, index) => {
            const uv_x = index / (pts.length - 1)
            const uv_y = pt.t / spline_time
            uvs.push(uv_x, uv_y, uv_x, uv_y)
            indices.push(index * 2, index * 2 + 1)
        })

    }

    const geom = new PIXI.Geometry()
    geom.addAttribute('aVertexPosition', verts)
    geom.addAttribute('aUv', uvs)
    geom.addIndex(indices)

    return geom
}


export { SplineInstance, SplineUniforms }