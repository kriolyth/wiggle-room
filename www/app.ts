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
import { Point, NormalSpline } from './spline';
import { SplineInstance, SplineUniforms } from './splineInstance';
import * as PIXI from 'pixi.js';

/// app class
class App {
    pixi: PIXI.Application;
    lineShader: PIXI.Program;
    splines: SplineInstance[] = [];
    inputs: { [index: number]: { points: Point[], spline: SplineInstance }} = {}

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
            fCycle: 0.,
            clStart: [1., 0., 0.],
            clEnd: [1., 1., 0]
        }
        this.lineShader = new PIXI.Program(`

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
        uniform vec3 clStart;
        uniform vec3 clEnd;
    
        void main() {
            // set colour as function of position on the line
            vec3 cl = mix(clStart, clEnd, uv.y);
            
            // shade ends by position on chunk ends
            gl_FragColor = vec4(cl, 1.0);
        }
    
    `)

    }

    /// load resources
    load() {
        app.pixi.loader.add([]).load(() => this.setup());
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
            this.pixi.stage.removeChildren()

            const line_fraction = config.field.lineFraction;
            const interval_start = Math.max(0, fCycle * (1 + line_fraction) - line_fraction)
            const interval_end = Math.min(1., fCycle * (1 + line_fraction))
            for (let sp of this.splines) {
                sp.setCycle(fCycle)
                sp.setSplinePart(Math.max(0., interval_start), Math.max(0., interval_end - interval_start))
                sp.rebuild()
                if (sp.isRenderable()) {
                    this.pixi.stage.addChild(sp.mesh!)
                }
            }

            // current drawn line
            for (let input of Object.values(this.inputs)) {
                input.spline.rebuild()
                if (input.spline.isRenderable())
                    this.pixi.stage.addChild(input.spline.mesh!)
            }

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
    beginLine(lineIndex: number) {
        if (this.inputs[lineIndex] === undefined) {
            const inputSplineUniforms = new SplineUniforms()
            inputSplineUniforms.fCycle = 0
            inputSplineUniforms.clStart = [1., 0., 1.]
            inputSplineUniforms.clEnd = [.8, .9, .9]
            this.inputs[lineIndex] = {
                points: [], 
                spline: new SplineInstance(this.lineShader, undefined, inputSplineUniforms)
            }
        }
    }

    /// add a point to current line
    addPointToLine(lineIndex: number, x: number, y: number) {
        const STEP = 0.03;
        if (this.inputs[lineIndex] === undefined)
            return
        const inputPts = this.inputs[lineIndex].points
        // add points to line, but not too close in time
        if (inputPts.length == 0 || this.simulationTime - inputPts[inputPts.length - 1].t > STEP) {
            if (inputPts.length) {
                const lastPoint = inputPts[inputPts.length - 1]
                // duplicate previous point if the pause was too long - this should cue interpolation
                for (let t = lastPoint.t + STEP; t < this.simulationTime - STEP * 2; t += STEP)
                    inputPts.push(new Point(lastPoint.x, lastPoint.y, t))
            }
            inputPts.push(new Point(x, y, this.simulationTime))
        }
        if (inputPts.length > 3)
            this.inputs[lineIndex].spline.updateSpline(new NormalSpline(inputPts));
    }

    /// complete the line
    /// Return 'true' if there was a line to complete
    endLine(lineIndex: number) {
        if (this.inputs[lineIndex] === undefined)
            return false
        if (this.inputs[lineIndex].points.length > 3) {
            const new_spline = new SplineInstance(this.lineShader, this.inputs[lineIndex].spline.spline)
            this.splines.push(new_spline)
            delete this.inputs[lineIndex]
            return true
        }
        return false
    }
}

let app: App;
function createApp(container: HTMLElement) {
    app = new App(container)
    return app
}

export { App, app, createApp }