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

import config from './config';
import {Spline, Point} from './spline';
import * as PIXI from 'pixi.js';

/// app class
class App {
    pixi: PIXI.Application;
    lineShader: PIXI.Shader;
    linePoints: Point[];
    spline: Spline;

    lastFrameTime: number;
    simulationTime: number;

    paused: boolean;
    ready: boolean;

    constructor(container: HTMLElement) {
        this.pixi = new PIXI.Application({
            backgroundColor: config.colours.background,
            antialias: true,
            resizeTo: container
        });
        this.pixi.ticker.maxFPS = config.display.maxfps;
        this.ready = false;
        this.paused = false;

        this.lastFrameTime = 0;
        this.simulationTime = 0;

        const frag_line_bg_colour = 'vec3(0.1835)'
        const uniforms = {
            fCycle: 0.
        }
        this.lineShader = PIXI.Shader.from(`

            precision mediump float;
            attribute vec2 aVertexPosition;
            attribute vec2 aUv; // .x = position on the subspline, .y = position on the whole line
        
            uniform mat3 translationMatrix;
            uniform mat3 projectionMatrix;

            varying vec2 uv;
        
            void main() {
                gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                uv = aUv;
            }`,
            `
            precision mediump float;
            varying vec2 uv;

            uniform float fCycle;
        
            void main() {
                // vec3 cl = mix(vec3(1.0, 0., 0.), vec3(1.0, 1.0, 0.), vColor.x - fCycle * 2. + 1.);
                // set colour as function of position on the line
                vec3 cl = mix(vec3(1.0, 0., 0.), vec3(1.0, 1.0, 0.), uv.y);
                
                // shade ends by position on chunk ends
                gl_FragColor = vec4(mix(
                    cl, 
                    ${frag_line_bg_colour}, 
                    smoothstep(0.45, 0.5, abs(0.5 - uv.x))), 
                    1.0);
            }
        
        `, uniforms);

        this.linePoints = [
            new Point(20, 120, 0), new Point(50, 120, 1),
            new Point(80, 140, 2), new Point(110, 150, 3), 
            new Point(140, 180, 4), new Point(170, 150, 5), 
            new Point(200, 160, 6), new Point(230, 130, 7), 
            new Point(260, 110, 8), new Point(290, 90, 9), 
            new Point(320, 70, 10), new Point(350, 100, 11), 
            new Point(380, 110, 12), new Point(410, 120, 13), 
        ].map(pt => new Point(pt.x * 4, pt.y, pt.t/13));
        this.spline = new Spline(this.linePoints)
        console.log(this.spline.kx, this.spline.ky)
    }

    /// load resources
    load() {
        app.pixi.loader.add([]).load(() => this.setup());
    }

    lineSegment(ends: Point[], tangents: number[], verts: number[]) {
        const width = 1.0;
        ends.forEach((pt, index) => {
            const sink = Math.sin(-tangents[index])
            const cosk = Math.cos(-tangents[index])
            verts.push(
                pt.x - width * sink, pt.y - width * cosk,
                pt.x + width * sink, pt.y + width * cosk,
            );
        })
    }

    pointsToMeshStrip(pts: Point[]): PIXI.Geometry {
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
            this.lineSegment(pts, tangents, verts)
            pts.forEach((pt, index) => {
                const uv_x = index / (pts.length - 1)
                const uv_y = pt.t / this.spline.time
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

    /// field setup
    setup() {

        // some basic colours

        // field ui

        this.pixi.ticker.add(delta => this.loop(delta));

        this.start();
    }

    /// draw loop
    loop(delta: number) {
        if (this.ready && !this.paused) {
            this.simulationTime += delta / 60.;
            const fCycle = this.simulationTime / config.field.cycleLength - Math.trunc(this.simulationTime / config.field.cycleLength)
            // clear everything
            const previous_meshes = this.pixi.stage.removeChildren()
            for (let mesh of previous_meshes) {
                mesh.destroy()
            }

            const line_fraction = this.spline.time / 3;
            const interval_start = Math.max(0, fCycle * (1 + line_fraction) - line_fraction)
            const interval_end = Math.min(1., fCycle * (1 + line_fraction))
            const sub_interval = this.spline.subInterval(
                Math.max(0., interval_start),
                Math.max(0., interval_end - interval_start))

            const spline_geom = this.pointsToMeshStrip(sub_interval)
            const spline_mesh = new PIXI.Mesh(spline_geom, this.lineShader, PIXI.State.for2d(), PIXI.DRAW_MODES.TRIANGLE_STRIP)
            spline_mesh.shader.uniforms.fCycle = fCycle
            this.pixi.stage.addChild(spline_mesh)
        }

        // draw ui
    }
    /// Reset the simulation
    reset() {
        this.ready = false;
    }

    /// Start a new simulation
    start() {

        this.simulationTime = 0
        this.ready = true
        this.startRender()
        this.resume()
    }

    /// Pause a currently active simulation
    pause() {
        this.paused = true
    }
    /// Resume a currently active simulation
    resume() {
        this.paused = false
    }
    isPaused() {
        return this.paused
    }
    isReady() {
        return this.ready
    }
    startRender() {
        this.pixi.start()
    }
    stopRender() {
        this.pixi.stop()
    }

    /// Start entering new line
    beginLine() {
        this.linePoints = []
    }

    /// add a point to current line
    addPointToLine(x: number, y: number) {

        if (this.linePoints.length == 0 || this.simulationTime - this.linePoints[this.linePoints.length-1].t > 0.03)
            this.linePoints.push(new Point(x, y, this.simulationTime))
        if (this.linePoints.length > 3)
            this.spline = new Spline(this.linePoints)
    }

    /// complete the line
    endLine() {
        // map all time to zero
        const startTime = this.linePoints[0].t
        const totalTime = this.linePoints[this.linePoints.length-1].t - startTime
        this.linePoints.forEach(pt => pt.t = (pt.t - startTime) / totalTime)
        console.log(this.linePoints)
        this.spline = new Spline(this.linePoints)
    }
}

let app: App;
function createApp(container: HTMLElement) {
    app = new App(container)
    return app
}

export { app, createApp }