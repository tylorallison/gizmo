
/** ========================================================================
 * start the game when page is loaded
 */
window.onload = async function() {
    let lastUpdate = Math.round(performance.now());
    let frame = 0;
    let started = false;
    const maxDeltaTime = 1000/20;
    //const evt = Events.main;

    // start the game
    //Minia.start();

    window.requestAnimationFrame(loop);

    function loop(hts) {
        // handle start
        if (!started) {
            //evt.trigger(Game.evtStarted);
            started = true;
        }
        // increment frame counter
        frame++;
        if (frame > Number.MAX_SAFE_INTEGER) frame = 0;
        // compute delta time
        const dt = Math.min(maxDeltaTime, hts - lastUpdate);
        lastUpdate = hts;
        //evt.trigger(Game.evtTock, { deltaTime: parseInt(dt), frame: frame });
        // next iteration
        window.requestAnimationFrame(loop);
    }

}
