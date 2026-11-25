import {gsap,vh,vw,$} from '../lib/core.js';
import {odometer} from '../lib/text.js';
export function animatePetr({mobile}) {
  const root=document.getElementById('petr');
  const setYear=odometer(root.querySelector('.year'));
  setYear(1909);
    gsap.set('.field', { clipPath: 'inset(0% 50% 0% 50%)', opacity: 1 });
    gsap.set('.war-video', { scale: 1.28 });
    gsap.set('.field-shade', { opacity: 0 });
    gsap.set('.field-dim', { opacity: 0 });
    gsap.set('.scene-fog', { opacity: 0, x: 0 });
    gsap.set('.year', { xPercent: -50, x: 0, opacity: 1, color: 'rgba(201,137,74,0)' });
    gsap.set('.front-copy .line-mask > span', { yPercent: 120 });
    gsap.set('.war-photo', { y: vh(70), rotationX: 28, rotationZ: -10, opacity: 0 });
    gsap.set('.photo-surface', { filter: 'invert(1) sepia(.6) contrast(1.4) drop-shadow(0px 4px 6px rgba(0,0,0,.1))' });
    gsap.set('.triangle', { x: vw(55), y: -vh(50), rotation: 65, rotationX: 24, opacity: 0 });
    gsap.set('.open-letter', { rotationY: 90, rotationZ: -1, opacity: 0 });
    gsap.set('.letter-writing p span', { clipPath: 'inset(0% 100% 0% 0%)' });
    gsap.set('.letter-count', { opacity: 0, y: 15 });
    gsap.set('.medal', { y: -vh(60), rotation: -7, opacity: 0 });
    gsap.set('.medal-glint', { xPercent: -120 });
    gsap.set('.medal-copy .line-mask > span', { yPercent: 120 });
    gsap.set('.quote-word', { opacity: 0, filter: 'blur(6px)' });
    gsap.set('.quote-source, .final-fog, .paper-wash', { opacity: 0 });
    gsap.set('.epilogue', { autoAlpha: 0 });

    const yearState = { value: 1909 };
    const letters = { value: 1 };
    const film = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'petr', trigger: root, start: 'top top', end: () => `+=${vh(620)}`,
        pin: root.querySelector('.chapter-stage'), scrub: 1.2, invalidateOnRefresh: true,
      },
    });

    // All positions are percentages on one 100-unit chapter timeline.
    film.addLabel('year', 0)
      .to(yearState, { value: 1941, duration: 12, onUpdate: () => setYear(yearState.value) }, 0)
      .addLabel('front', 12)
      .to('.field', { clipPath: 'inset(0% 0% 0% 0%)', duration: 18 }, 12)
      .to('.war-video', { scale: 1.06, y: () => -vh(2), duration: 18 }, 12)
      .to('.war-video', { scale: 1.13, y: () => -vh(5), duration: 56 }, 30)
      .to('.field-shade', { opacity: 1, duration: 12 }, 12)
      .to('.scene-fog', { opacity: .28, duration: 14 }, 12)
      .to('.scene-fog', { x: () => -vw(2), y: () => -vh(4), duration: 74 }, 12)
      .to('.year', { x: () => -vw(mobile ? 2 : 23), y: () => -vh(mobile ? 3 : 1), scale: mobile ? .92 : 1, opacity: .18, duration: 18 }, 12)
      .set('.year', { color: '#c9894a', mixBlendMode: 'overlay' }, 12)
      .to('.front-copy .line-mask > span', { yPercent: 0, duration: 4.5, stagger: 3 }, 18)
      .addLabel('photograph', 30)
      .to('.war-photo', { y: 0, rotationX: 4, rotationZ: -3, opacity: 1, duration: 12, ease: 'power2.out' }, 30)
      .to('.photo-surface', { filter: 'invert(0) sepia(.15) contrast(1) drop-shadow(0px 40px 60px rgba(0,0,0,.55))', duration: 15 }, 30)
      .to('.field-dim', { opacity: .35, duration: 13 }, 30)
      .addLabel('letter', 48)
      .to('.war-photo', { x: () => -vw(mobile ? 22 : 43), y: () => -vh(mobile ? 8 : 6), scale: .7, filter: 'blur(3px)', opacity: .5, duration: 9 }, 48)
      .to('.war-photo figcaption, .front-copy', { opacity: 0, duration: 5 }, 48)
      .to('.triangle', { opacity: 1, x: () => -vw(mobile ? 7 : 23), y: () => vh(mobile ? 18 : 22), rotation: -7, rotationX: 0, duration: 6, ease: 'power2.out' }, 48)
      .to('.triangle', { rotationY: -90, opacity: 0, duration: 3.5, ease: 'power1.in' }, 53)
      .to('.open-letter', { rotationY: 0, opacity: 1, duration: 4, ease: 'power1.out' }, 54)
      .to('.letter-writing p span', { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, stagger: 1.8 }, 57)
      .to('.letter-count', { opacity: 1, y: 0, duration: 3 }, 56)
      .to(letters, { value: 37, duration: 11, onUpdate: () => { $('.count-number').textContent = Math.round(letters.value); } }, 56)
      .addLabel('medal', 68)
      .to('.open-letter', { y: () => vh(80), opacity: 0, rotationX: -12, duration: 9, ease: 'power1.in' }, 68)
      .to('.letter-count', { opacity: 0, y: 30, duration: 5 }, 68)
      .to('.war-photo', { opacity: 0, y: () => -vh(13), duration: 7 }, 68)
      .to('.field', { filter: 'saturate(.7)', duration: 8 }, 68)
      .to('.field-dim', { opacity: .55, duration: 10 }, 68)
      .to('.year', { opacity: 0, duration: 5 }, 68)
      .to('.medal', { y: 0, opacity: 1, duration: 10, ease: 'power2.out' }, 68)
      .to('.medal', { rotation: 5, duration: 6, ease: 'sine.inOut' }, 68)
      .to('.medal', { rotation: -2, duration: 6, ease: 'sine.inOut' }, 74)
      .to('.medal', { rotation: 0, duration: 6, ease: 'sine.out' }, 80)
      .to('.medal-glint', { xPercent: 120, duration: 5 }, 78)
      .to('.medal-copy .line-mask > span', { yPercent: 0, duration: 3.5, stagger: 2 }, 76)
      .addLabel('last-letter', 86)
      .to('.field, .field-shade, .medal, .medal-copy, .chapter-label', { opacity: 0, duration: 3 }, 86)
      .to('.field-dim', { opacity: 0, duration: 3 }, 86)
      .to('.scene-fog', { opacity: .28, duration: 4 }, 86)
      .to('.quote-word', { opacity: 1, filter: 'blur(0px)', duration: 2.4, stagger: .55 }, 87)
      .to('.quote-source', { opacity: .8, duration: 2 }, 92)
      .addLabel('next-chapter', 96)
      .to('.final-fog', { opacity: .35, yPercent: -12, duration: 4 }, 96)
      .to('.last-letter', { opacity: 0, duration: 3 }, 97)
      .addLabel('end', 100);


return {timeline:film};
}
