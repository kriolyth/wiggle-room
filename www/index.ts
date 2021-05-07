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

import { createApp } from './app'
import config from './config'

// bind app to DOM
function bindApp() {
    const view = document.getElementById("view") ?? document.body
    const app = createApp(view)
    app.load()

    view.appendChild(app.pixi.view)

    document.getElementById("reset")?.addEventListener("click", () => {
        app.reset()
        app.startRender()
        const pp = document.getElementById("play-pause")
        if (pp) {
            pp.innerHTML = 'Play'
        }
    })
    document.getElementById("play-pause")?.addEventListener("click", () => {
        const pp = document.getElementById("play-pause");
        if (!pp)
            return;
        if (app.isReady() && app.isPaused()) {
            app.resume()
            pp.innerHTML = 'Pause'
        }
        else if (app.isReady() && !app.isPaused()) {
            app.pause()
            pp.innerHTML = 'Play'
        } else if (!app.isReady()) {
            app.start()
            pp.innerHTML = 'Pause'
        }
    })
    document.getElementById("view")?.addEventListener("mousemove", (ev: MouseEvent) => {
        if (!app.isReady() && (ev.buttons & 1)) {
            // drawing mode: not running, mouse button pressed
            // app.addCustomParticle(ev.offsetX, ev.offsetY)
            app.startRender()
        }
    })
    document.getElementById("view")?.addEventListener("touchmove", (ev: TouchEvent) => {
        const rc = document.getElementById("view")?.getBoundingClientRect();
        if (rc && !app.isReady()) {
            // drawing mode: not running, touch active
            for (let touch of Array.from(ev.touches)) {
                const px = touch.clientX - rc.left
                const py = touch.clientY - rc.top
                // app.addCustomParticle(px, py)
                app.startRender()
            }
        }
    })


}

if (document.readyState !== 'loading') bindApp()
else window.addEventListener('DOMContentLoaded', bindApp)

