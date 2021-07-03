(self["webpackChunkwiggle_room_html"] = self["webpackChunkwiggle_room_html"] || []).push([["index_ts"],{

/***/ "./app.ts":
/*!****************!*\
  !*** ./app.ts ***!
  \****************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "App": () => (/* binding */ App),
/* harmony export */   "app": () => (/* binding */ app),
/* harmony export */   "createApp": () => (/* binding */ createApp)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "./config/index.ts");
/* harmony import */ var _spline__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./spline */ "./spline.ts");
/* harmony import */ var _splineInstance__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./splineInstance */ "./splineInstance.ts");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_3__);
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




/// app class
var App = /** @class */ (function () {
    function App(container) {
        this.splines = [];
        this.inputs = {};
        this.pixi = new pixi_js__WEBPACK_IMPORTED_MODULE_3__.Application({
            backgroundColor: _config__WEBPACK_IMPORTED_MODULE_0__.default.colours.background,
            antialias: true,
            resizeTo: container
        });
        this.pixi.ticker.maxFPS = _config__WEBPACK_IMPORTED_MODULE_0__.default.display.maxfps;
        this.ready = false;
        this.paused = false;
        this.lastFrameTime = 0;
        this.simulationTime = 0;
        this.lineShader = new pixi_js__WEBPACK_IMPORTED_MODULE_3__.Program("\n\n        precision mediump float;\n        attribute vec2 aVertexPosition;\n        attribute vec2 aUv; // .x = position on the subspline, .y = position on the whole line\n    \n        uniform mat3 translationMatrix;\n        uniform mat3 projectionMatrix;\n\n        varying vec2 uv;\n    \n        void main() {\n            gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n            uv = aUv;\n        }", "\n        precision mediump float;\n        varying vec2 uv;\n\n        uniform float fCycle;\n        uniform vec3 clStart;\n        uniform vec3 clEnd;\n    \n        void main() {\n            // set colour as function of position on the line\n            vec3 cl = mix(clStart, clEnd, uv.y);\n            \n            // shade ends by position on chunk ends\n            gl_FragColor = vec4(cl, 1.0);\n        }");
        this.inputContainer = new pixi_js__WEBPACK_IMPORTED_MODULE_3__.Container();
    }
    /// load resources
    App.prototype.load = function () {
        var _this = this;
        app.pixi.loader.add([]).load(function () { return _this.setup(); });
    };
    /// field setup
    App.prototype.setup = function () {
        // some basic colours
        var _this = this;
        // field ui
        this.pixi.ticker.add(function (delta) { return _this.loop(delta); });
        this.pixi.stage.addChild(this.inputContainer);
        this.start();
    };
    /// draw loop
    App.prototype.loop = function (delta) {
        if (this.ready && !this.paused) {
            this.simulationTime += delta / 60.;
            var fCycle = this.simulationTime / _config__WEBPACK_IMPORTED_MODULE_0__.default.field.cycleLength - Math.trunc(this.simulationTime / _config__WEBPACK_IMPORTED_MODULE_0__.default.field.cycleLength);
            // clear currently drawn lines - they are rebuilt every frame
            this.inputContainer.removeChildren();
            var line_fraction = _config__WEBPACK_IMPORTED_MODULE_0__.default.field.lineFraction;
            var interval_start = Math.max(0, fCycle * (1 + line_fraction) - line_fraction);
            var interval_end = Math.min(1., fCycle * (1 + line_fraction));
            for (var _i = 0, _a = this.splines; _i < _a.length; _i++) {
                var sp = _a[_i];
                sp.setCycle(fCycle);
                sp.setSplinePart(Math.max(0., interval_start), Math.max(0., interval_end));
                sp.rebuild();
                if (sp.isRenderable()) {
                    sp.render();
                    // presently finished curves always remain at the stage, so we can easily retain them
                    if (sp.mesh.parent !== this.pixi.stage)
                        this.pixi.stage.addChild(sp.mesh);
                }
            }
            // current drawn lines
            for (var _b = 0, _c = Object.values(this.inputs); _b < _c.length; _b++) {
                var input = _c[_b];
                input.spline.rebuild();
                if (input.spline.isRenderable()) {
                    input.spline.render();
                    this.inputContainer.addChild(input.spline.mesh);
                }
            }
        }
        // draw ui
    };
    /// Reset the simulation
    App.prototype.reset = function () {
        this.ready = false;
    };
    /// Start a new simulation
    App.prototype.start = function () {
        this.simulationTime = 0;
        this.ready = true;
        this.startRender();
        this.resume();
    };
    /// Pause a currently active simulation
    App.prototype.pause = function () {
        this.paused = true;
    };
    /// Resume a currently active simulation
    App.prototype.resume = function () {
        this.paused = false;
    };
    App.prototype.isPaused = function () {
        return this.paused;
    };
    App.prototype.isReady = function () {
        return this.ready;
    };
    App.prototype.startRender = function () {
        this.pixi.start();
    };
    App.prototype.stopRender = function () {
        this.pixi.stop();
    };
    /// Start entering new line
    App.prototype.beginLine = function (lineIndex) {
        if (this.inputs[lineIndex] === undefined) {
            var inputSplineUniforms = new _splineInstance__WEBPACK_IMPORTED_MODULE_2__.SplineUniforms();
            inputSplineUniforms.fCycle = 0;
            inputSplineUniforms.clStart = [1., 0., 1.];
            inputSplineUniforms.clEnd = [.8, .9, .9];
            this.inputs[lineIndex] = {
                points: [],
                spline: new _splineInstance__WEBPACK_IMPORTED_MODULE_2__.SplineInstance(this.lineShader, undefined, inputSplineUniforms)
            };
        }
    };
    /// add a point to current line
    App.prototype.addPointToLine = function (lineIndex, x, y) {
        var STEP = 0.03;
        if (this.inputs[lineIndex] === undefined)
            return;
        var inputPts = this.inputs[lineIndex].points;
        // add points to line, but not too close in time
        if (inputPts.length == 0 || this.simulationTime - inputPts[inputPts.length - 1].t > STEP) {
            if (inputPts.length) {
                var lastPoint = inputPts[inputPts.length - 1];
                // duplicate previous point if the pause was too long - this should cue interpolation
                for (var t = lastPoint.t + STEP; t < this.simulationTime - STEP * 2; t += STEP)
                    inputPts.push(new _spline__WEBPACK_IMPORTED_MODULE_1__.Point(lastPoint.x, lastPoint.y, t));
            }
            inputPts.push(new _spline__WEBPACK_IMPORTED_MODULE_1__.Point(x, y, this.simulationTime));
        }
        if (inputPts.length > 3)
            this.inputs[lineIndex].spline.updateSpline(new _spline__WEBPACK_IMPORTED_MODULE_1__.NormalSpline(inputPts));
    };
    /// complete the line
    /// Return 'true' if there was a line to complete
    App.prototype.endLine = function (lineIndex) {
        if (this.inputs[lineIndex] === undefined)
            return false;
        if (this.inputs[lineIndex].points.length > 3) {
            var new_spline = new _splineInstance__WEBPACK_IMPORTED_MODULE_2__.SplineInstance(this.lineShader, this.inputs[lineIndex].spline.spline);
            this.splines.push(new_spline);
            delete this.inputs[lineIndex];
            return true;
        }
        return false;
    };
    return App;
}());
var app;
function createApp(container) {
    app = new App(container);
    return app;
}



/***/ }),

/***/ "./config/colours.ts":
/*!***************************!*\
  !*** ./config/colours.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    background: 0x2f2f2f,
    text: 0xe3e3e3,
    tintMoving: 0xffdc38,
    tintStatic: 0x60e87c
});


/***/ }),

/***/ "./config/display.ts":
/*!***************************!*\
  !*** ./config/display.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    maxfps: 60 // limit fps
});


/***/ }),

/***/ "./config/field.ts":
/*!*************************!*\
  !*** ./config/field.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    cycleLength: 3.,
    lineFraction: .3, // fraction of line to display
});


/***/ }),

/***/ "./config/index.ts":
/*!*************************!*\
  !*** ./config/index.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _colours__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./colours */ "./config/colours.ts");
/* harmony import */ var _display__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./display */ "./config/display.ts");
/* harmony import */ var _field__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./field */ "./config/field.ts");
/*
   Copyright 2020 Alexander Efremkin

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



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({ colours: _colours__WEBPACK_IMPORTED_MODULE_0__.default, display: _display__WEBPACK_IMPORTED_MODULE_1__.default, field: _field__WEBPACK_IMPORTED_MODULE_2__.default });


/***/ }),

/***/ "./index.ts":
/*!******************!*\
  !*** ./index.ts ***!
  \******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./app */ "./app.ts");
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

// bind app to DOM
function bindApp() {
    var _a, _b, _c, _d, _e, _f, _g;
    var view = (_a = document.getElementById("view")) !== null && _a !== void 0 ? _a : document.body;
    var app = (0,_app__WEBPACK_IMPORTED_MODULE_0__.createApp)(view);
    app.load();
    view.appendChild(app.pixi.view);
    (_b = document.getElementById("view")) === null || _b === void 0 ? void 0 : _b.addEventListener("mousedown", function (ev) {
        if (!app.isReady()) {
            app.startRender();
        }
        if (ev.buttons & 1) {
            // drawing mode: mouse button pressed
            app.beginLine(0);
            app.addPointToLine(0, ev.offsetX, ev.offsetY);
        }
    });
    (_c = document.getElementById("view")) === null || _c === void 0 ? void 0 : _c.addEventListener("touchstart", function (ev) {
        var _a;
        if (!app.isReady()) {
            app.startRender();
        }
        var rc = (_a = document.getElementById("view")) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        if (rc) {
            // drawing mode: touch / multitouch
            for (var _i = 0, _b = Array.from(ev.touches); _i < _b.length; _i++) {
                var touch = _b[_i];
                app.beginLine(touch.identifier);
                app.addPointToLine(touch.identifier, touch.clientX - rc.left, touch.clientY - rc.top);
            }
        }
    });
    (_d = document.getElementById("view")) === null || _d === void 0 ? void 0 : _d.addEventListener("mousemove", function (ev) {
        if (ev.buttons & 1) {
            // drawing mode: mouse button still pressed
            app.addPointToLine(0, ev.offsetX, ev.offsetY);
        }
    });
    (_e = document.getElementById("view")) === null || _e === void 0 ? void 0 : _e.addEventListener("touchmove", function (ev) {
        var _a;
        var rc = (_a = document.getElementById("view")) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        if (rc) {
            // drawing mode: touch / multitouch
            for (var _i = 0, _b = Array.from(ev.changedTouches); _i < _b.length; _i++) {
                var touch = _b[_i];
                app.addPointToLine(touch.identifier, touch.clientX - rc.left, touch.clientY - rc.top);
            }
        }
    });
    (_f = document.getElementById("view")) === null || _f === void 0 ? void 0 : _f.addEventListener("mouseup", function (ev) {
        if (ev.button == 0) {
            // left button depressed - end the line
            app.endLine(0);
        }
    });
    (_g = document.getElementById("view")) === null || _g === void 0 ? void 0 : _g.addEventListener("touchend", function (ev) {
        ev.preventDefault();
        for (var _i = 0, _a = Array.from(ev.changedTouches); _i < _a.length; _i++) {
            var touch = _a[_i];
            // we can use endLine result to distinguish a tap and a move
            app.endLine(touch.identifier);
        }
    });
}
if (document.readyState !== 'loading')
    bindApp();
else
    window.addEventListener('DOMContentLoaded', bindApp);


/***/ }),

/***/ "./spline.ts":
/*!*******************!*\
  !*** ./spline.ts ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Point": () => (/* binding */ Point),
/* harmony export */   "NormalSpline": () => (/* binding */ NormalSpline)
/* harmony export */ });
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
var Point = /** @class */ (function () {
    function Point(x, y, t) {
        this.x = x;
        this.y = y;
        this.t = t;
    }
    return Point;
}());
var SplineCoeff = /** @class */ (function () {
    function SplineCoeff(a, b, c, d, t1, t2) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.t1 = t1;
        this.t2 = t2;
    }
    SplineCoeff.prototype.interpolate = function (t) {
        t -= this.t1;
        var t2 = t * t;
        var t3 = t * t * t;
        return this.a * t3 + this.b * t2 + this.c * t + this.d;
    };
    return SplineCoeff;
}());
var NormalSpline = /** @class */ (function () {
    function NormalSpline(pts) {
        // normalize timestamps to [0..1]
        this.points = pts.map(function (pt) { return new Point(pt.x, pt.y, (pt.t - pts[0].t) / (pts[pts.length - 1].t - pts[0].t)); });
        this.kx = Array(pts.length - 1);
        this.ky = Array(pts.length - 1);
        this.time = this.points[this.points.length - 1].t;
        this.calcSpline();
    }
    NormalSpline.prototype.calcSpline = function () {
        var _this = this;
        var nPoints = this.points.length;
        var dt = Array(nPoints - 1);
        var dx = Array(nPoints - 1);
        var dy = Array(nPoints - 1);
        var fttx = Array(nPoints);
        var ftty = Array(nPoints);
        this.points.slice(0, -1).forEach(function (pt, index) {
            dt[index] = _this.points[index + 1].t - pt.t;
            dx[index] = (_this.points[index + 1].x - pt.x) / dt[index];
            dy[index] = (_this.points[index + 1].y - pt.y) / dt[index];
        });
        fttx[0] = 0;
        ftty[0] = 0;
        for (var i = 0; i < nPoints - 1; i++) {
            fttx[i + 1] = 3 * (dx[i + 1] - dx[i]) / (dt[i + 1] + dt[i]);
            ftty[i + 1] = 3 * (dy[i + 1] - dy[i]) / (dt[i + 1] + dt[i]);
        }
        fttx[nPoints - 1] = 0;
        ftty[nPoints - 1] = 0;
        this.points.slice(0, -1).forEach(function (pt, i) {
            _this.kx[i] = new SplineCoeff((fttx[i + 1] - fttx[i]) / (6 * dt[i]), fttx[i] / 2, dx[i] - dt[i] * (fttx[i + 1] + 2 * fttx[i]) / 6, pt.x, pt.t, _this.points[i + 1].t);
            _this.ky[i] = new SplineCoeff((ftty[i + 1] - ftty[i]) / (6 * dt[i]), ftty[i] / 2, dy[i] - dt[i] * (ftty[i + 1] + 2 * ftty[i]) / 6, pt.y, pt.t, _this.points[i + 1].t);
        });
    };
    NormalSpline.prototype.subInterval = function (t_offset, t_length) {
        var t_first = this.points[0].t;
        var t_last = this.points[this.points.length - 1].t;
        // interpolate between t_offset and t_offset + t_length
        // Limit the the final result to no more that 16k vertices (the curve will lose detail)
        var NUM_STEPS = Math.min(20 + this.points.length * 4, 8190);
        // clamp t_offset so that interpolated region is range
        t_offset = Math.max(t_first, Math.min(t_last - t_length, t_offset));
        var result = Array(NUM_STEPS + 1);
        var ix_spline = Math.max(0, this.kx.findIndex(function (sp) { return sp.t1 <= t_offset && t_offset < sp.t2; }));
        for (var step = 0; step <= NUM_STEPS; step++) {
            var t = t_offset + t_length * step / NUM_STEPS;
            while (this.kx[ix_spline].t2 < t) {
                ix_spline++;
            }
            result[step] = new Point(this.kx[ix_spline].interpolate(t), this.ky[ix_spline].interpolate(t), t);
        }
        return result;
    };
    return NormalSpline;
}());



/***/ }),

/***/ "./splineInstance.ts":
/*!***************************!*\
  !*** ./splineInstance.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SplineInstance": () => (/* binding */ SplineInstance),
/* harmony export */   "SplineUniforms": () => (/* binding */ SplineUniforms)
/* harmony export */ });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
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

var SplineUniforms = /** @class */ (function () {
    function SplineUniforms() {
        this.fCycle = 0.;
        this.clStart = [1., 0., 0.];
        this.clEnd = [1., 1., 0];
    }
    return SplineUniforms;
}());
var SplineInstance = /** @class */ (function () {
    function SplineInstance(program, spline, uniforms) {
        this.spline = spline;
        if (uniforms)
            this.uniforms = uniforms;
        else
            this.uniforms = new SplineUniforms();
        this.shader = new pixi_js__WEBPACK_IMPORTED_MODULE_0__.Shader(program, this.uniforms);
        this.needsRebuild = true;
        this.spStart = 0.;
        this.spEnd = 1.;
        this.timeIndices = [];
    }
    SplineInstance.prototype.pointsToMeshStrip = function (pts, spline_time) {
        var _this = this;
        var width = 2.0 * (devicePixelRatio || 1.0);
        // using new Array in theory preallocates an array to a certain size
        // This has the inconveniency that we cannot "push" to array but must
        // use precise indices
        // Every vertex and UV has "x1, y1, x2, y2" numbers per every point
        var verts = new Array(pts.length * 4);
        var uvs = new Array(pts.length * 4);
        this.timeIndices = new Array(pts.length);
        if (pts.length == 1) {
            // draw a square
            verts = [
                pts[0].x - width, pts[0].y - width,
                pts[0].x - width, pts[0].y + width,
                pts[0].x + width, pts[0].y - width,
                pts[0].x + width, pts[0].y + width,
            ];
            uvs = [0, 0, 0, 1, 1, 0, 1, 1];
            this.timeIndices = [0, 1];
        }
        else {
            // Build a uniform-width "tunnel" along the line
            // Find tangents at segment points
            var tangents = pts.map(function (pt, index) {
                if (index == 0)
                    return Math.atan2(pts[index + 1].y - pt.y, pts[index + 1].x - pt.x);
                else if (index == pts.length - 1)
                    return Math.atan2(pt.y - pts[index - 1].y, pt.x - pts[index - 1].x);
                // average the two -- better to use weighted average by length though
                return 0.5 * (Math.atan2(pts[index + 1].y - pt.y, pts[index + 1].x - pt.x) +
                    Math.atan2(pt.y - pts[index - 1].y, pt.x - pts[index - 1].x));
            });
            // create tunnel vertices (a pair of them per every line point)
            lineSegment(pts, tangents, verts);
            pts.forEach(function (pt, index) {
                var uv_x = index / (pts.length - 1);
                var uv_y = pt.t / spline_time;
                uvs[index * 4 + 0] = uv_x;
                uvs[index * 4 + 1] = uv_y;
                uvs[index * 4 + 2] = uv_x;
                uvs[index * 4 + 3] = uv_y;
                _this.timeIndices[index] = uv_y;
            });
        }
        var geom = new pixi_js__WEBPACK_IMPORTED_MODULE_0__.Geometry();
        geom.addAttribute('aVertexPosition', verts);
        geom.addAttribute('aUv', uvs);
        return geom;
    };
    SplineInstance.prototype.updateSpline = function (spline) {
        this.spline = spline;
        this.needsRebuild = true;
    };
    SplineInstance.prototype.setColours = function (clStart, clEnd) {
        this.uniforms.clStart = clStart;
        this.uniforms.clEnd = clEnd;
        if (this.mesh) {
            this.mesh.shader.uniforms.clStart = this.uniforms.clStart;
            this.mesh.shader.uniforms.clEnd = this.uniforms.clEnd;
        }
    };
    SplineInstance.prototype.setCycle = function (fCycle) {
        this.uniforms.fCycle = fCycle;
        if (this.mesh) {
            this.mesh.shader.uniforms.fCycle = this.uniforms.fCycle;
        }
    };
    SplineInstance.prototype.setSplinePart = function (fStart, fEnd) {
        this.spStart = fStart;
        this.spEnd = fEnd;
    };
    SplineInstance.prototype.rebuild = function () {
        if (!this.needsRebuild || !this.spline)
            return;
        if (this.mesh)
            this.mesh.destroy();
        this.mesh = new pixi_js__WEBPACK_IMPORTED_MODULE_0__.Mesh(this.pointsToMeshStrip(this.spline.subInterval(0., 1.), this.spline.time), this.shader, pixi_js__WEBPACK_IMPORTED_MODULE_0__.State.for2d(), pixi_js__WEBPACK_IMPORTED_MODULE_0__.DRAW_MODES.TRIANGLE_STRIP);
        this.needsRebuild = false;
    };
    /// Find vertex index at a specified time point
    SplineInstance.prototype.findTimeIndex = function (time) {
        if (time <= 0)
            return 0;
        else if (time >= 1.)
            return this.timeIndices.length - 1;
        // we start from an approximate point, which is much faster than plain linear search
        var index = Math.round(time * this.timeIndices.length);
        while (index > 0 && this.timeIndices[index] >= time) {
            index--;
        }
        if (index == 0 && this.timeIndices[index] >= time) {
            return index;
        }
        while (index < this.timeIndices.length - 1 && this.timeIndices[index] < time) {
            index++;
        }
        return index;
    };
    SplineInstance.prototype.render = function () {
        if (!this.mesh)
            return;
        // convert start and end times to vertex offsets
        var vxStart = 0;
        var vxEnd = -1; // special value for "all"
        if (this.timeIndices) {
            vxStart = this.findTimeIndex(this.spStart);
            vxEnd = this.findTimeIndex(this.spEnd);
        }
        if (vxStart == -1) {
            // there was no start index found - it is likely beyond end, and so nothing should be drawn
            return;
        }
        if (vxStart == vxEnd) {
            // same point - do not draw anything
            return;
        }
        this.mesh.start = vxStart * 2;
        this.mesh.size = (vxEnd - vxStart) * 2;
    };
    SplineInstance.prototype.isRenderable = function () {
        return (this.spline !== undefined);
    };
    SplineInstance.prototype.reset = function () {
        this.spline = undefined;
        this.mesh = undefined;
    };
    return SplineInstance;
}());
/////////////////////////////////
// Utilities
/////////////////////////////////
function lineSegment(ends, tangents, verts) {
    var width = 2.0 * (devicePixelRatio || 1.0);
    ends.forEach(function (pt, index) {
        var sink = Math.sin(-tangents[index]);
        var cosk = Math.cos(-tangents[index]);
        verts[index * 4 + 0] = pt.x - width * sink;
        verts[index * 4 + 1] = pt.y - width * cosk;
        verts[index * 4 + 2] = pt.x + width * sink;
        verts[index * 4 + 3] = pt.y + width * cosk;
    });
}



/***/ })

}]);