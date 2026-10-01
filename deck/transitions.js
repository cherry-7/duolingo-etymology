// How one slide hands over to the next, inspired by the continuous scroll flow of lusion.co.
// A slide's `transition` (in slides.js) names one of these.
//
// Motion is tied to the deck's (smoothed) scroll position, so it plays forward when moving
// on and in reverse when going back. Each transition is two functions of t, where t goes
// from 0 (previous slide fully on screen) to 1 (this slide fully on screen):
//   enter(t)  style for the arriving slide (it sits on top)
//   leave(t)  style for the slide underneath, as it gives way
// They return { transform, clipPath, opacity, filter } (any subset).
//
// On top of the transition, the arriving slide's content rises in with a stagger
// (see revealContent in deck.js).
//
// These are placeholders until /design (or Michelle's inspo) defines each scene.

window.TRANSITIONS = {
  // The next chapter rises from below while this one sinks back into the distance
  rise: {
    enter: (t) => ({
      transform: `translateY(${(1 - t) * 100}%)`,
      clipPath: `inset(0 round ${(1 - t) * 48}px ${(1 - t) * 48}px 0 0)`
    }),
    leave: (t) => ({
      transform: `translateY(${-t * 20}%) scale(${1 - t * 0.12})`,
      clipPath: `inset(0 round ${t * 48}px)`,
      opacity: 1 - t * 0.6
    })
  },

  // A small rounded window in the center opens up into the next scene
  window: {
    enter: (t) => {
      const x = (1 - t) * 34;
      const y = (1 - t) * 30;
      return {
        clipPath: `inset(${y}% ${x}% round ${(1 - t) * 40 + 0}px)`,
        transform: `scale(${1 + (1 - t) * 0.25})`
      };
    },
    leave: (t) => ({
      transform: `scale(${1 - t * 0.08})`,
      filter: `blur(${t * 6}px)`,
      opacity: 1 - t * 0.5
    })
  },

  // The camera pushes into this scene and the next one comes into focus
  "push-in": {
    enter: (t) => ({
      transform: `scale(${0.8 + t * 0.2})`,
      filter: `blur(${(1 - t) * 12}px)`,
      opacity: Math.min(1, t * 1.6)
    }),
    leave: (t) => ({
      transform: `scale(${1 + t * 1.2})`,
      opacity: 1 - t
    })
  },

  // The next scene slides in from the side over a parallax drift
  "slide-over": {
    enter: (t) => ({
      transform: `translateX(${(1 - t) * 100}%)`,
      clipPath: `inset(0 round ${(1 - t) * 48}px 0 0 ${(1 - t) * 48}px)`
    }),
    leave: (t) => ({
      transform: `translateX(${-t * 30}%) scale(${1 - t * 0.08})`,
      opacity: 1 - t * 0.5
    })
  }
};
