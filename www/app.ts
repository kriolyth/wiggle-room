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
import * as PIXI from 'pixi.js';

class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

/// app class
class App {
    pixi: PIXI.Application;
    lineShader: PIXI.Shader;
    linePoints: Point[];

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

        const frag_bg_colour = 'vec3(0.1835)'
        const uniforms = {
            fCycle: 0.
        }
        this.lineShader = PIXI.Shader.from(`

            precision mediump float;
            attribute vec2 aVertexPosition;
            attribute vec2 aUv;
        
            uniform mat3 translationMatrix;
            uniform mat3 projectionMatrix;

            varying vec3 vColor;
        
            void main() {
                gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vColor = vec3(aUv.x);
            }`,
            `
            precision mediump float;
            varying vec3 vColor;

            uniform float fCycle;
        
            void main() {
                vec3 cl = mix(vec3(1.0, 0., 0.), vec3(1.0, 1.0, 0.), vColor.x - fCycle * 2. + 1.);
                gl_FragColor = vec4(mix(cl, ${frag_bg_colour}, smoothstep(0.4, 0.5, abs(0.5 - vColor.x + fCycle * 2. - 1.))), 1.0);
            }
        
        `, uniforms);

        this.linePoints = [
            new Point(20, 120), new Point(50, 120), 
            new Point(80, 140), new Point(110, 150), 
            new Point(140, 180), new Point(170, 150), 
            new Point(200, 160), new Point(230, 130), 
            new Point(260, 110), new Point(290, 90), 
            new Point(320, 70), new Point(350, 100), 
            new Point(380, 110), new Point(410, 120), 
        ]
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
            const tangents = pts.map((pt, index) => {
                if (index == 0) return Math.atan2(pts[index + 1].y - pt.y, pts[index + 1].x - pt.x)
                else if (index == pts.length - 1) return Math.atan2(pt.y - pts[index - 1].y, pt.x - pts[index - 1].x)
                // average the two -- better to use weighted average by length though
                return 0.5 * (Math.atan2(pts[index + 1].y - pt.y, pts[index + 1].x - pt.x) + Math.atan2(pt.y - pts[index - 1].y, pt.x - pts[index - 1].x))
            })
            this.lineSegment(pts, tangents, verts)
            pts.forEach((_, index) => {
                const uv_x = index / (pts.length - 1)
                uvs.push(uv_x, 0.0, uv_x, 1.0)
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
            // clear everything
            this.pixi.stage.removeChildren()

            for (let tick = 0; tick < config.field.ticksPerCall; tick++) {
                // update movements
            }

            const line_geom = this.pointsToMeshStrip(this.linePoints)
            const line_mesh = new PIXI.Mesh(line_geom, this.lineShader, PIXI.State.for2d(), PIXI.DRAW_MODES.TRIANGLE_STRIP)
            line_mesh.shader.uniforms.fCycle = this.simulationTime / 3. - Math.trunc(this.simulationTime / 3.);
            this.pixi.stage.addChild(line_mesh)
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
}

let app: App;
function createApp(container: HTMLElement) {
    app = new App(container)
    return app
}

export { app, createApp }