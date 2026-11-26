import {gsap,vh,vw,$} from '../lib/core.js';
import {odometer} from '../lib/text.js';
import {animateLifeTitle} from '../lib/life-title.js';
export function animatePetr({mobile}) {
  const root=document.getElementById('petr');
  const intro=animateLifeTitle(root);
  const setYear=odometer(root.querySelector('.year'));
  setYear(1909);
    gsap.set('.field', { clipPath: 'none', opacity: 1 });
    gsap.set('.war-video', { scale: 1.28 });
    gsap.set('.field-shade', { opacity: 0 });
    gsap.set('.field-dim', { opacity: 0 });
    gsap.set('.scene-fog', { opacity: 0, x: 0 });
    gsap.set('.year', { xPercent: -50, x: 0, opacity: 1, color: intro?'#c9894a':'rgba(201,137,74,0)' });
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

    const yearState = { value: 1909 };
    const letters = { value: 1 };
    const film = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'petr', trigger: root, start: 'top top', end: () => `+=${vh(620)}`,
        pin: root.querySelector('.chapter-stage'), scrub: 1.2, invalidateOnRefresh: true,
        onUpdate:self=>{if(self.progress>.005&&intro&&intro.progress()<1)intro.progress(1);},
      },
    });

    // All positions are percentages on one 100-unit chapter timeline.
    film.addLabel('year', 0)
      .to(yearState, { value: 1941, duration: 12, onUpdate: () => setYear(yearState.value) }, 0)
      .addLabel('front', 12)
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
      .addLabel('photo-exit',45)
      .to('.war-photo', { x: () => -vw(mobile ? 30 : 50), y: () => -vh(10), scale: .7, filter: 'blur(3px)', opacity: 0, duration: 4 }, 45)
      .to('.war-photo figcaption, .front-copy', { opacity: 0, duration: 4 }, 45)
      .addLabel('letter',50)
      .to('.triangle', { opacity: 1, x: () => -vw(mobile ? 7 : 23), y: () => vh(mobile ? 18 : 22), rotation: -7, rotationX: 0, duration: 3, ease: 'power2.out' }, 50)
      .to('.triangle', { rotationY: -90, opacity: 0, duration: 3, ease: 'power1.in' }, 54)
      .to('.open-letter', { rotationY: 0, opacity: 1, duration: 3, ease: 'power1.out' }, 58)
      .to('.letter-writing p span', { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, stagger: 1.8 }, 61)
      .to('.letter-count', { opacity: 1, y: 0, duration: 2 }, 60)
      .to(letters, { value: 37, duration: 9, onUpdate: () => { $('.count-number').textContent = Math.min(37,Math.max(1,Math.round(letters.value))); } }, 60)
      .addLabel('letters-37',69)
      .addLabel('letter-exit',73)
      .to('.open-letter', { y: () => vh(80), opacity: 0, rotationX: -12, duration: 3, ease: 'power1.in' }, 73)
      .to('.letter-count', { opacity: 0, y: 30, duration: 3 }, 73)
      .to('.field', { filter: 'saturate(.7)', duration: 8 }, 73)
      .to('.field-dim', { opacity: .55, duration: 6 }, 73)
      .to('.year', { opacity: 0, duration: 3 }, 73)
      .addLabel('medal',77)
      .to('.medal', { y: 0, opacity: 1, duration: 4, ease: 'power2.out' }, 77)
      .to('.medal', { rotation: 5, duration: 4, ease: 'sine.inOut' }, 77)
      .to('.medal', { rotation: -2, duration: 3, ease: 'sine.inOut' }, 81)
      .to('.medal', { rotation: 0, duration: 3, ease: 'sine.out' }, 84)
      .to('.medal-glint', { xPercent: 120, duration: 3 }, 82)
      .to('.medal-copy .line-mask > span', { yPercent: 0, duration: 2.5, stagger: 1.5 }, 80)
      .addLabel('medal-exit',87)
      .to('.medal, .medal-copy', { opacity: 0, duration: 2 }, 87)
      .addLabel('last-letter',89.5)
      // The medal is already gone; retain the field until words take its place.
      .to('.field, .field-shade, .chapter-label', { opacity: 0, duration: 3 }, 89.5)
      .to('.field-dim', { opacity: 0, duration: 3 }, 89.5)
      .to('.scene-fog', { opacity: .28, duration: 4 }, 87)
      .to('.quote-word', { opacity: 1, filter: 'blur(0px)', duration: 1.8, stagger: .35 }, 89.5)
      .to('.quote-source', { opacity: .8, duration: 2 }, 95)
      .addLabel('next-chapter',98)
      .to('.final-fog', { opacity: .35, yPercent: -12, duration: 2 }, 98)
      .addLabel('end', 100);


return {timeline:film,intro};
}
