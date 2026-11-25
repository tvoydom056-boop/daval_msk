import {gsap,vh,vw} from '../lib/core.js';
export function animateHero() {
  const root=document.getElementById('hero');
  const tree=document.getElementById('tree');
  tree.inert=true;
    gsap.set('.hero-video', { scale: 1.18 });
    gsap.set('.letter-mask > span', { yPercent: 116 });
    gsap.set('.hero-script', { opacity: 0, y: 24 });
    gsap.set('.hero-description, .scroll-invitation', { opacity: 1, y: 0 });
    gsap.set('.hero-fog-back', { yPercent: 75, opacity: 0 });
    gsap.set('.hero-fog-front', { yPercent: 100, opacity: 0 });
    gsap.set('.hero-haze', { opacity: 0 });
    gsap.set(root, { autoAlpha: 1 });

    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro.to('.hero-video', { scale: 1, duration: 2.4 }, 0)
      .to('.letter-mask > span', { yPercent: 0, stagger: .045, duration: 1.45 }, .15)
      .to('.hero-script', { y: 0, opacity: 1, duration: 1.6 }, .5);

    const hero = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'hero', trigger: root, start: 'top top', end: () => `+=${vh(115)}`,
        pin: true, pinSpacing: false, scrub: 1, invalidateOnRefresh: true,
        onUpdate: (self) => { tree.inert=self.progress<.72;if (self.progress > .005 && intro.progress() < 1) intro.progress(1); },
      },
    });
    hero.addLabel('home', 0)
      .to('.hero-camera', { scale: 1.14, y: () => -vh(6), duration: 100 }, 0)
      .to('.hero-type', { y: () => -vh(28), opacity: 0, filter: 'blur(8px)', duration: 62 }, 0)
      .fromTo('.hero-description, .scroll-invitation', { opacity: 1, y: 0 }, { opacity: 0, y: () => -vh(9), duration: 21, immediateRender: false }, 14)
      .addLabel('fog-rise', 35)
      .to('.hero-fog-back', { yPercent: -38, x: () => -vw(3), opacity: 1, duration: 37 }, 35)
      .to('.hero-fog-front', { yPercent: -12, x: () => vw(4), opacity: .85, duration: 37 }, 35)
      .to('.hero-camera', { opacity: 0, duration: 22 }, 50)
      .to('.hero-haze', { opacity: .94, duration: 22 }, 50)
      .addLabel('fog-cover', 72)
      .to('.hero-fog-back', { yPercent: -55, x: () => -vw(5), duration: 16 }, 72)
      .to('.hero-fog-front', { yPercent: -24, x: () => vw(6), duration: 16 }, 72)
      .to(root, { autoAlpha: 0, duration: 28 }, 72)
      .addLabel('tree-revealed', 100);


return {timeline:hero,intro};
}
