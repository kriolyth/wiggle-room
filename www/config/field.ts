export default {
    width: 256,         // field half-width
    height: 256,        // field half-height
    startParticles: 0,  // generate this many particles at start
    maxParticles: 2000, // max particles (see also limits in field.rs)
    spawnRate: 25.,     // new particles per second
    ticksPerCall: 1,    // simulation iterations per draw call
}