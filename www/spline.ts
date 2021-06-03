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

class Point {
    x: number;
    y: number;
    t: number;

    constructor(x: number, y: number, t: number) {
        this.x = x;
        this.y = y;
        this.t = t;
    }
}

class SplineCoeff {
    a: number;  // cubic spline coefficiant
    b: number;
    c: number;
    d: number;  // constant
    t1: number; // relevant interval
    t2: number;

    constructor(a: number, b: number, c: number, d: number, t1: number, t2: number) {
        this.a = a
        this.b = b
        this.c = c
        this.d = d
        this.t1 = t1
        this.t2 = t2
    }

    interpolate(t: number) {
        t -= this.t1
        const t2 = t * t;
        const t3 = t * t * t;
        return this.a * t3 + this.b * t2 + this.c * t + this.d
    }
}

class Spline {
    points: Point[];
    kx: SplineCoeff[];
    ky: SplineCoeff[];
    time: number;

    constructor(pts: Point[]) {
        this.points = pts.map(pt => new Point(pt.x, pt.y, (pt.t - pts[0].t) / (pts[pts.length - 1].t - pts[0].t)))
        this.kx = Array(pts.length - 1);
        this.ky = Array(pts.length - 1);
        this.time = this.points[this.points.length - 1].t
        this.calcSpline()
    }

    calcSpline() {
        const nPoints = this.points.length;
        let dt: number[] = Array(nPoints - 1);
        let dx: number[] = Array(nPoints - 1);
        let dy: number[] = Array(nPoints - 1);
        let fttx: number[] = Array(nPoints);
        let ftty: number[] = Array(nPoints);

        this.points.slice(0, -1).forEach((pt, index) => {
            dt[index] = this.points[index + 1].t - pt.t
            dx[index] = (this.points[index + 1].x - pt.x) / dt[index]
            dy[index] = (this.points[index + 1].y - pt.y) / dt[index]
        })
        fttx[0] = 0; ftty[0] = 0;
        for (let i = 0; i < nPoints - 1; i++) {
            fttx[i + 1] = 3 * (dx[i + 1] - dx[i]) / (dt[i + 1] + dt[i]);
            ftty[i + 1] = 3 * (dy[i + 1] - dy[i]) / (dt[i + 1] + dt[i]);
        }
        fttx[nPoints-1] = 0; ftty[nPoints-1] = 0;

        this.points.slice(0, -1).forEach((pt, i) => {
            this.kx[i] = new SplineCoeff(
                (fttx[i + 1] - fttx[i]) / (6 * dt[i]),
                fttx[i] / 2,
                dx[i] - dt[i] * (fttx[i + 1] + 2 * fttx[i]) / 6,
                pt.x,
                pt.t, this.points[i + 1].t
            )
            this.ky[i] = new SplineCoeff(
                (ftty[i + 1] - ftty[i]) / (6 * dt[i]),
                ftty[i] / 2,
                dy[i] - dt[i] * (ftty[i + 1] + 2 * ftty[i]) / 6,
                pt.y,
                pt.t, this.points[i + 1].t
            )
        })
    }

    subInterval(t_offset: number, t_length: number): Point[] {
        const t_first = this.points[0].t
        const t_last = this.points[this.points.length - 1].t

        // interpolate between t_offset and t_offset + t_length
        const NUM_STEPS = 20 + this.points.length;
        // clamp t_offset so that interpolated region is range
        t_offset = Math.max(t_first, Math.min(t_last - t_length, t_offset))

        let result: Point[] = Array(NUM_STEPS + 1)

        let ix_spline = Math.max(0, this.kx.findIndex(sp => sp.t1 <= t_offset && t_offset < sp.t2))
        for (let step = 0; step <= NUM_STEPS; step++) {
            const t = t_offset + t_length * step / NUM_STEPS
            while (this.kx[ix_spline].t2 < t) {
                ix_spline++;
            }
            result[step] = new Point(this.kx[ix_spline].interpolate(t), this.ky[ix_spline].interpolate(t), t)
        }

        return result
    }
}

export { Point, Spline }