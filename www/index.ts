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

import { App, createApp } from './app'

// bind app to DOM
function bindApp() {
    const view = document.getElementById("view") ?? document.body
    const app = createApp(view)
    app.load()

    view.appendChild(app.pixi.view)

    document.getElementById("view")?.addEventListener("mousedown", (ev: MouseEvent) => {
        if (!app.isReady()) {
            app.startRender()
        }
        if (ev.buttons & 1) {
            // drawing mode: mouse button pressed
            app.beginLine()
            app.addPointToLine(ev.offsetX, ev.offsetY)
        }
    })
    document.getElementById("view")?.addEventListener("touchstart", (ev: TouchEvent) => {
        if (!app.isReady()) {
            app.startRender()
        }
        const rc = document.getElementById("view")?.getBoundingClientRect();
        if (rc && ev.touches.length == 1) {
            // drawing mode: single point
            const touch = ev.touches[0]!
            app.beginLine()
            app.addPointToLine(touch.clientX - rc.left, touch.clientY - rc.top)
        }
    })

    document.getElementById("view")?.addEventListener("mousemove", (ev: MouseEvent) => {
        if (ev.buttons & 1) {
            // drawing mode
            app.addPointToLine(ev.offsetX, ev.offsetY)
        }
    })
    document.getElementById("view")?.addEventListener("touchmove", (ev: TouchEvent) => {
        const rc = document.getElementById("view")?.getBoundingClientRect();
        if (rc && ev.touches.length == 1) {
            // drawing mode: single point
            for (let touch of Array.from(ev.touches)) {
                app.addPointToLine(touch.clientX - rc.left, touch.clientY - rc.top)
            }
        }
    })

    document.getElementById("view")?.addEventListener("mouseup", (ev: MouseEvent) => {
        if (ev.button == 0) {
            // left button depressed - end the line
            app.endLine()
        }
    })
    document.getElementById("view")?.addEventListener("touchend", (ev: TouchEvent) => {
        if (ev.touches.length == 0) {
            // touch ended
            app.endLine()
        }
    })
}

if (document.readyState !== 'loading') bindApp()
else window.addEventListener('DOMContentLoaded', bindApp)

