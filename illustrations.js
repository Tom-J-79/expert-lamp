/* Bellwork figures — SVG joints (SMIL). Body parts and bells animate separately. */
(() => {
  const KB = "#d06a2b";
  const INK = "#f3ead8";
  const MUTED = "#8a8f7a";
  const ST = `stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"`;

  function rot(values, dur) {
    dur = dur || "1.4s";
    return `<animateTransform attributeName="transform" type="rotate" values="${values}" dur="${dur}" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1"/>`;
  }

  function slide(values, dur) {
    dur = dur || "1.4s";
    return `<animateTransform attributeName="transform" type="translate" values="${values}" dur="${dur}" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1"/>`;
  }

  function bell(s, flip) {
    s = s || 1;
    const w = 7.2 * s, h = 6 * s, hw = 4 * s;
    const turn = flip ? ` transform="rotate(180)"` : "";
    return `<g class="kb"${turn}>
      <path d="M${-hw} ${-h * 0.65} C${-hw} ${-h * 1.12} ${hw} ${-h * 1.12} ${hw} ${-h * 0.65}" fill="none" stroke="${KB}" stroke-width="${1.45 * s}"/>
      <ellipse cx="0" cy="0" rx="${w}" ry="${h}" fill="${KB}"/>
      <ellipse cx="0" cy="${-0.7 * s}" rx="${w * 0.26}" ry="${h * 0.2}" fill="#f0b07a" opacity="0.32"/>
    </g>`;
  }

  function ground() {
    return `<path d="M12 90 H88" stroke="${MUTED}" stroke-width="1.2" opacity="0.4"/>`;
  }

  function wrap(inner) {
    return `<svg class="ex-svg" viewBox="0 0 100 100" aria-hidden="true">${ground()}${inner}</svg>`;
  }

  /* Jointed standing person. Hip at 50,54. Each limb group rotates around its own joint. */
  function person(p) {
    p = Object.assign({
      dur: "1.4s",
      torso: "6; 2; 6",
      hips: "0 0; 0 0; 0 0",
      armL: "18; 14; 18",
      armR: "-18; -14; -18",
      foreL: "8; 6; 8",
      foreR: "-8; -6; -8",
      legL: "8; 4; 8",
      legR: "-8; -4; -8",
      shinL: "-6; -4; -6",
      shinR: "6; 4; 6",
      hold: "none",
      wide: false,
      kickR: false
    }, p);

    const d = p.dur;
    let leftHand = "", rightHand = "", chestBell = "";
    if (p.hold === "l" || p.hold === "both") leftHand = `<g transform="translate(0 1)">${bell(0.72)}</g>`;
    if (p.hold === "r" || p.hold === "both") rightHand = `<g transform="translate(0 1)">${bell(0.72)}</g>`;
    if (p.hold === "goblet") chestBell = `<g transform="translate(0 -17)">${bell(0.78)}</g>`;
    if (p.hold === "rack") chestBell = `<g transform="translate(8 -21)">${bell(0.7)}</g>`;
    if (p.hold === "racks") {
      chestBell = `<g transform="translate(-8 -21)">${bell(0.66)}</g><g transform="translate(8 -21)">${bell(0.66)}</g>`;
    }

    const thighL = p.wide ? "-11 16" : "-7 17";
    const thighR = p.wide ? "11 16" : "7 17";
    const [tlx, tly] = thighL.split(" ");
    const [trx, try_] = thighR.split(" ");

    const rearR = p.kickR
      ? `<g class="leg-r">${rot(p.legR, d)}<path d="M0 0 L14 6" ${ST}/>
          <g transform="translate(14 6)"><g>${rot(p.shinR, d)}<path d="M0 0 L12 2" ${ST}/></g></g></g>`
      : `<g class="leg-r">${rot(p.legR, d)}<path d="M0 0 L${trx} ${try_}" ${ST}/>
          <g transform="translate(${trx} ${try_})"><g>${rot(p.shinR, d)}<path d="M0 0 L3 17" ${ST}/></g></g></g>`;

    return `<g class="athlete" transform="translate(50 54)">
      <g class="hips">${slide(p.hips, d)}
        <g class="torso">${rot(p.torso, d)}
          <path d="M0 0 L0 -26" ${ST}/>
          <circle cx="0" cy="-34" r="6" fill="none" stroke="${INK}" stroke-width="1.85"/>
          <g transform="translate(-3 -22)">
            <g class="arm-l">${rot(p.armL, d)}
              <path d="M0 0 L3 13" ${ST}/>
              <g transform="translate(3 13)">
                <g class="fore-l">${rot(p.foreL, d)}
                  <path d="M0 0 L2 12" ${ST}/>
                  <g transform="translate(2 12)">${leftHand}</g>
                </g>
              </g>
            </g>
          </g>
          <g transform="translate(3 -22)">
            <g class="arm-r">${rot(p.armR, d)}
              <path d="M0 0 L-3 13" ${ST}/>
              <g transform="translate(-3 13)">
                <g class="fore-r">${rot(p.foreR, d)}
                  <path d="M0 0 L-2 12" ${ST}/>
                  <g transform="translate(-2 12)">${rightHand}</g>
                </g>
              </g>
            </g>
          </g>
          ${chestBell}
        </g>
        <g transform="translate(-2 0)">
          <g class="leg-l">${rot(p.legL, d)}
            <path d="M0 0 L${tlx} ${tly}" ${ST}/>
            <g transform="translate(${tlx} ${tly})">
              <g class="shin-l">${rot(p.shinL, d)}<path d="M0 0 L-3 17" ${ST}/></g>
            </g>
          </g>
        </g>
        <g transform="translate(2 0)">${rearR}</g>
      </g>
    </g>`;
  }

  /* Bell that swings around the hip, not parented to the torso. */
  function pendulum(dur, a0, a1, drop, scale) {
    dur = dur || "1.4s";
    drop = drop == null ? 27 : drop;
    scale = scale || 0.95;
    return `<g transform="translate(50 54)">
      <g>${rot(`${a0}; ${a1}; ${a0}`, dur)}
        <g transform="translate(0 ${drop})">${bell(scale)}</g>
      </g>
    </g>`;
  }

  function twoPendulum(dur, a0, a1) {
    return `<g transform="translate(50 54)">
      <g>${rot(`${a0}; ${a1}; ${a0}`, dur)}
        <g transform="translate(-7 27)">${bell(0.78)}</g>
        <g transform="translate(7 27)">${bell(0.78)}</g>
      </g>
    </g>`;
  }

  function floatBell(x0, y0, x1, y1, dur) {
    dur = dur || "1.3s";
    return `<g>${slide(`${x0} ${y0}; ${x1} ${y1}; ${x0} ${y0}`, dur)}${bell(0.82)}</g>`;
  }

  const swingBody = {
    dur: "1.35s",
    torso: "26; -6; 26",
    hips: "3 1; 0 -1; 3 1",
    armL: "32; -8; 32",
    armR: "22; -16; 22",
    foreL: "6; 2; 6",
    foreR: "6; 2; 6",
    legL: "12; 2; 12",
    legR: "-12; -2; -12",
    shinL: "-14; -4; -14",
    shinR: "14; 4; 14",
    hold: "none"
  };

  const squatBody = {
    dur: "1.5s",
    torso: "8; 3; 8",
    hips: "0 8; 0 0; 0 8",
    armL: "-38; -34; -38",
    armR: "38; 34; 38",
    foreL: "-18; -14; -18",
    foreR: "18; 14; 18",
    legL: "36; 6; 36",
    legR: "-36; -6; -36",
    shinL: "-46; -8; -46",
    shinR: "46; 8; 46"
  };

  const hingeBody = {
    dur: "1.65s",
    torso: "34; 6; 34",
    hips: "4 2; 0 0; 4 2",
    armL: "8; 16; 8",
    armR: "-8; -16; -8",
    foreL: "4; 4; 4",
    foreR: "-4; -4; -4",
    legL: "16; 4; 16",
    legR: "-16; -4; -16",
    shinL: "-16; -4; -16",
    shinR: "16; 4; 16",
    hold: "both"
  };

  const lungeBody = {
    dur: "1.55s",
    torso: "6; 2; 6",
    hips: "0 5; 0 1; 0 5",
    armL: "-30; -26; -30",
    armR: "30; 26; 30",
    foreL: "-10; -8; -10",
    foreR: "10; 8; 10",
    legL: "28; 8; 28",
    legR: "-22; -6; -22",
    shinL: "-24; -8; -24",
    shinR: "-20; -10; -20",
    hold: "goblet"
  };

  const pressBody = {
    dur: "1.4s",
    torso: "3; -2; 3",
    hips: "0 0; 0 0; 0 0",
    armL: "14; 10; 14",
    armR: "-40; -168; -40",
    foreL: "8; 6; 8",
    foreR: "-20; 5; -20",
    legL: "4; 4; 4",
    legR: "-4; -4; -4",
    hold: "r"
  };

  const walkBody = {
    dur: "0.7s",
    torso: "-3; 3; -3",
    hips: "0 0; 0 -2; 0 0",
    armL: "22; -16; 22",
    armR: "-22; 16; -22",
    foreL: "8; 4; 8",
    foreR: "-8; -4; -8",
    legL: "16; -14; 16",
    legR: "-14; 16; -14",
    shinL: "-10; -18; -10",
    shinR: "-18; -10; -18",
    hold: "both"
  };

  function floorPerson(kind) {
    const d = kind === "mountain" ? "0.5s" : "1.35s";
    const arm = kind === "push" ? rot("8; 32; 8", d) : rot("4; 8; 4", d);
    const torsoMove = kind === "push"
      ? slide("0 0; 0 6; 0 0", d)
      : kind === "mountain"
        ? slide("0 0; 0 1; 0 0", d)
        : slide("0 0; 0 1.5; 0 0", d);
    const legL = kind === "mountain" ? rot("-8; -48; -8", d) : rot("2; 4; 2", d);
    const legR = kind === "mountain" ? rot("-48; -8; -48", d) : rot("2; 4; 2", d);
    return `<g transform="translate(50 48)">
      <g>${torsoMove}
        <path d="M-26 0 L22 0" ${ST}/>
        <circle cx="-34" cy="-1" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
        <g transform="translate(-18 0)"><g>${arm}<path d="M0 0 L-1 22" ${ST}/></g></g>
        <g transform="translate(6 0)"><g>${arm}<path d="M0 0 L2 10" ${ST}/></g></g>
        <g transform="translate(14 0)"><g>${legL}<path d="M0 0 L10 22" ${ST}/></g></g>
        <g transform="translate(20 0)"><g>${legR}<path d="M0 0 L12 20" ${ST}/></g></g>
      </g>
    </g>`;
  }

  function hangPerson(pull) {
    const d = "1.5s";
    const body = pull ? slide("0 10; 0 0; 0 10", d) : rot("-4; 4; -4", "2.2s");
    return `<path d="M22 13 H78" stroke="${MUTED}" stroke-width="2.2" stroke-linecap="round"/>
      <g transform="translate(50 14)">
        <g>${body}
          <path d="M-16 0 L0 20 L16 0" ${ST}/>
          <path d="M0 20 L0 34" ${ST}/>
          <circle cx="0" cy="12" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
          <g transform="translate(-3 34)"><g>${rot(pull ? "8; 12; 8" : "6; -6; 6", d)}<path d="M0 0 L-5 16" ${ST}/></g></g>
          <g transform="translate(3 34)"><g>${rot(pull ? "-8; -12; -8" : "-6; 6; -6", d)}<path d="M0 0 L5 16" ${ST}/></g></g>
        </g>
      </g>`;
  }

  const poses = {
    "kb-swing": () => wrap(person(swingBody) + pendulum("1.35s", 38, -46)),
    "kb-2h-swing": () => wrap(person(swingBody) + pendulum("1.35s", 38, -46, 27, 1.02)),
    "kb-1h-swing": () => wrap(person(Object.assign({}, swingBody, { armL: "-12; 8; -12", foreL: "-8; 4; -8" })) + pendulum("1.35s", 36, -44)),
    "kb-double-swing": () => wrap(person(swingBody) + twoPendulum("1.35s", 36, -44)),
    "kb-deadlift": () => wrap(person(hingeBody)),
    "kb-sumo-dl": () => wrap(person(Object.assign({}, hingeBody, { wide: true }))),
    "kb-single-leg-rdl": () => wrap(person(Object.assign({}, hingeBody, { hold: "l", kickR: true, legR: "-55; -30; -55", shinR: "8; 4; 8", torso: "30; 10; 30" }))),
    "kb-good-morning": () => wrap(person(Object.assign({}, hingeBody, { hold: "goblet", armL: "-40; -36; -40", armR: "40; 36; 40" }))),
    "kb-goblet-squat": () => wrap(person(Object.assign({}, squatBody, { hold: "goblet" }))),
    "kb-front-squat": () => wrap(person(Object.assign({}, squatBody, { hold: "rack" }))),
    "kb-double-front-squat": () => wrap(person(Object.assign({}, squatBody, { hold: "racks" }))),
    "kb-rack-squat": () => wrap(person(Object.assign({}, squatBody, { hold: "rack" }))),
    "kb-lunge": () => wrap(person(lungeBody)),
    "kb-forward-lunge": () => wrap(person(Object.assign({}, lungeBody, { hold: "l" }))),
    "kb-walking-lunge": () => wrap(person(Object.assign({}, lungeBody, { hold: "both", dur: "0.85s" }))),
    "kb-cossack": () => wrap(person({
      dur: "1.7s", torso: "-10; 8; -10", hips: "-5 6; 5 6; -5 6",
      armL: "-30; -24; -30", armR: "30; 24; 30",
      legL: "42; 10; 42", legR: "-6; 28; -6",
      shinL: "-40; -10; -40", shinR: "10; -8; 10",
      hold: "goblet", wide: true
    })),
    "kb-press": () => wrap(person(pressBody)),
    "kb-push-press": () => wrap(person(Object.assign({}, pressBody, {
      dur: "1.25s", hips: "0 5; 0 -2; 0 5",
      legL: "14; 2; 14", legR: "-14; -2; -14",
      shinL: "-16; -4; -16", shinR: "16; 4; 16"
    }))),
    "kb-double-press": () => wrap(person(Object.assign({}, pressBody, {
      hold: "both", armL: "40; 168; 40", foreL: "20; -5; 20"
    }))),
    "kb-bottoms-up-press": () => wrap(person(pressBody)),
    "kb-floor-press": () => wrap(`<g transform="translate(50 64)">
      <path d="M-28 0 L20 0" ${ST}/>
      <circle cx="-34" cy="0" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <g transform="translate(-8 0)"><g>${rot("70; 10; 70", "1.4s")}<path d="M0 0 L0 -16" ${ST}/>
        <g transform="translate(0 -16)">${bell(0.7)}</g></g></g>
      <path d="M20 0 L36 6" ${ST}/><path d="M18 0 L34 12" ${ST}/>
    </g>`),
    "kb-tgu": () => wrap(person({
      dur: "2.6s", torso: "16; -4; 16", hips: "0 4; 0 0; 0 4",
      armR: "-120; -165; -120", foreR: "8; 0; 8",
      armL: "20; 8; 20",
      legL: "26; 6; 26", legR: "-12; 6; -12",
      hold: "r"
    })),
    "kb-windmill": () => wrap(person({
      dur: "2.1s", torso: "28; 10; 28", hips: "4 2; 0 0; 4 2",
      armR: "-160; -150; -160", foreR: "0; 0; 0",
      armL: "28; 12; 28", foreL: "10; 16; 10",
      legL: "10; 4; 10", legR: "-8; -4; -8",
      hold: "r"
    })),
    "kb-clean": () => wrap(person({
      dur: "1.25s", torso: "20; -2; 20",
      armR: "28; -70; 28", foreR: "8; -36; 8",
      armL: "12; 8; 12",
      legL: "14; 2; 14", legR: "-14; -2; -14",
      hold: "none"
    }) + floatBell(42, 78, 58, 28, "1.25s")),
    "kb-double-clean": () => wrap(person({
      dur: "1.25s", torso: "20; -2; 20",
      armL: "28; -70; 28", armR: "-28; 70; -28",
      legL: "14; 2; 14", legR: "-14; -2; -14"
    }) + floatBell(36, 78, 42, 28, "1.25s") + floatBell(58, 78, 58, 28, "1.25s")),
    "kb-snatch": () => wrap(person({
      dur: "1.28s", torso: "22; -6; 22",
      armR: "26; -168; 26", foreR: "6; 4; 6",
      armL: "10; 6; 10",
      legL: "16; 0; 16", legR: "-16; 0; -16"
    }) + `<g transform="translate(50 54)"><g>${rot("36; -78; 36", "1.28s")}<g transform="translate(0 28)">${bell(0.86)}</g></g></g>`),
    "kb-snatch-test": () => wrap(person({
      dur: "1.15s", torso: "20; -6; 20",
      armR: "24; -168; 24", foreR: "6; 4; 6",
      armL: "10; 8; 10",
      legL: "14; 0; 14", legR: "-14; 0; -14"
    }) + `<g transform="translate(50 54)"><g>${rot("34; -78; 34", "1.15s")}<g transform="translate(0 28)">${bell(0.86)}</g></g></g>`),
    "kb-high-pull": () => wrap(person({
      dur: "1.2s", torso: "18; -2; 18",
      armL: "16; -70; 16", armR: "-16; 70; -16",
      foreL: "8; -20; 8", foreR: "-8; 20; -8",
      legL: "12; 2; 12", legR: "-12; -2; -12"
    }) + `<g transform="translate(50 54)"><g>${rot("30; -42; 30", "1.2s")}<g transform="translate(0 24)">${bell(0.84)}</g></g></g>`),
    "kb-row": () => wrap(person({
      dur: "1.3s", torso: "32; 24; 32",
      armL: "10; -42; 10", foreL: "8; -18; 8",
      armR: "8; 12; 8",
      hold: "none",
      legL: "10; 8; 10", legR: "-6; -4; -6"
    }) + floatBell(34, 60, 44, 40, "1.3s")),
    "kb-renegade-row": () => wrap(floorPerson("plank") + floatBell(32, 78, 32, 78, "2s") + floatBell(62, 40, 58, 26, "1.3s")),
    "kb-farmer-carry": () => wrap(person(walkBody)),
    "kb-suitcase-carry": () => wrap(person(Object.assign({}, walkBody, { hold: "l", torso: "3; 1; 3" }))),
    "kb-rack-carry": () => wrap(person(Object.assign({}, walkBody, { hold: "rack", armR: "36; 32; 36" }))),
    "kb-oh-carry": () => wrap(person(Object.assign({}, walkBody, { hold: "r", armR: "-165; -158; -165", foreR: "0; 0; 0" }))),
    "kb-thruster": () => wrap(person(Object.assign({}, squatBody, {
      hold: "racks", dur: "1.3s",
      armL: "-40; 168; -40", armR: "40; -168; 40",
      foreL: "-16; -4; -16", foreR: "16; 4; 16"
    }))),
    "kb-clean-press": () => wrap(person({
      dur: "1.4s", torso: "16; -2; 16",
      armR: "24; -168; 24", foreR: "8; 4; 8",
      legL: "12; 2; 12", legR: "-12; -2; -12"
    }) + `<g transform="translate(50 54)"><g>${rot("30; -80; 30", "1.4s")}<g transform="translate(0 26)">${bell(0.8)}</g></g></g>`),
    "kb-clean-squat": () => wrap(person(Object.assign({}, squatBody, { hold: "rack" }))),
    "kb-halo": () => wrap(person({
      dur: "2.2s", torso: "2; -2; 2",
      armL: "-40; -10; -40", armR: "40; 10; 40",
      foreL: "-20; 10; -20", foreR: "20; -10; 20"
    }) + `<g transform="translate(50 20)"><g>${rot("0; 180; 360", "2.2s")}<g transform="translate(12 0)">${bell(0.7)}</g></g></g>`),
    "kb-around-the-world": () => wrap(person({
      dur: "2.4s", armL: "16; -10; 16", armR: "-16; 10; -16"
    }) + `<g transform="translate(50 54)"><g>${rot("0; 180; 360", "2.4s")}<g transform="translate(22 0)">${bell(0.76)}</g></g></g>`),
    "kb-figure-8": () => wrap(person({
      dur: "1.8s", armL: "18; -8; 18", armR: "-18; 8; -18",
      legL: "14; 10; 14", legR: "-14; -10; -14"
    }) + floatBell(38, 72, 62, 72, "1.8s")),

    "bw-pushup": () => wrap(floorPerson("push")),
    "bw-knee-pushup": () => wrap(floorPerson("push")),
    "bw-decline-pushup": () => wrap(floorPerson("push") + `<rect x="70" y="72" width="16" height="7" fill="none" stroke="${MUTED}"/>`),
    "bw-diamond-pushup": () => wrap(floorPerson("push")),
    "bw-archer-pushup": () => wrap(floorPerson("push")),
    "bw-pike-pushup": () => wrap(`<g transform="translate(50 60)">
      <g>${rot("4; 12; 4", "1.5s")}
        <path d="M-18 -16 L0 -32 L20 2" ${ST}/>
        <circle cx="-22" cy="-12" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
        <path d="M-18 -16 L-24 14" ${ST}/>
        <path d="M20 2 L26 22" ${ST}/>
      </g></g>`),
    "bw-handstand-hold": () => wrap(`<path d="M80 14 V88" stroke="${MUTED}" stroke-width="1.3" opacity="0.45"/>
      <g transform="translate(50 78)"><g>${rot("-4; 4; -4", "2.3s")}
        <path d="M-8 0 L0 -18 L8 0" ${ST}/>
        <path d="M0 -18 L0 -42" ${ST}/>
        <circle cx="0" cy="-50" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
        <path d="M0 -42 L-5 -58" ${ST}/>
        <path d="M0 -42 L5 -58" ${ST}/>
      </g></g>`),
    "bw-dip": () => wrap(`<rect x="18" y="50" width="64" height="5" fill="none" stroke="${MUTED}"/>` + person({
      dur: "1.4s", hips: "0 6; 0 0; 0 6",
      armL: "28; 8; 28", armR: "-28; -8; -28",
      torso: "2; 0; 2"
    })),
    "bw-pullup": () => wrap(hangPerson(true)),
    "bw-chinup": () => wrap(hangPerson(true)),
    "bw-inverted-row": () => wrap(`<path d="M18 28 H82" stroke="${MUTED}" stroke-width="2"/>
      <g transform="translate(50 50)"><g>${slide("0 5; 0 -2; 0 5", "1.35s")}
        <path d="M-24 2 L22 0" ${ST}/>
        <circle cx="-32" cy="3" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
        <path d="M-16 2 L-16 -16" ${ST}/>
        <path d="M8 0 L10 -14" ${ST}/>
        <path d="M22 0 L32 18" ${ST}/>
      </g></g>`),
    "bw-scap-hang": () => wrap(hangPerson(false)),
    "bw-squat": () => wrap(person(Object.assign({}, squatBody, { hold: "none", armL: "16; 12; 16", armR: "-16; -12; -16" }))),
    "bw-pulse-squat": () => wrap(person(Object.assign({}, squatBody, { dur: "0.7s", hold: "none", armL: "14; 10; 14", armR: "-14; -10; -14" }))),
    "bw-split-squat": () => wrap(person(Object.assign({}, lungeBody, { hold: "none", armL: "16; 12; 16", armR: "-16; -12; -16" }))),
    "bw-reverse-lunge": () => wrap(person(Object.assign({}, lungeBody, { hold: "none", armL: "16; 12; 16", armR: "-16; -12; -16" }))),
    "bw-walking-lunge": () => wrap(person(Object.assign({}, lungeBody, { hold: "none", dur: "0.8s", armL: "18; -12; 18", armR: "-18; 12; -18" }))),
    "bw-stepup": () => wrap(`<rect x="60" y="68" width="22" height="20" fill="none" stroke="${MUTED}"/>` + person({
      dur: "1.4s", hips: "0 3; 0 -4; 0 3",
      legR: "-8; -26; -8", legL: "8; 4; 8",
      armL: "14; -10; 14", armR: "-14; 10; -14"
    })),
    "bw-pistol": () => wrap(person(Object.assign({}, squatBody, {
      hold: "none", kickR: true, dur: "1.7s",
      armL: "-20; -12; -20", armR: "20; 12; 20",
      legR: "-48; -28; -48"
    }))),
    "bw-cossack": () => wrap(person({
      dur: "1.7s", torso: "-8; 8; -8", hips: "-4 6; 4 6; -4 6",
      armL: "16; 10; 16", armR: "-16; -10; -16",
      legL: "40; 10; 40", legR: "-4; 26; -4",
      shinL: "-38; -10; -38", wide: true
    })),
    "bw-glute-bridge": () => wrap(`<g transform="translate(50 72)"><g>${rot("10; -8; 10", "1.55s")}
      <path d="M-26 6 L20 -8" ${ST}/>
      <circle cx="-32" cy="8" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <path d="M20 -8 L26 16" ${ST}/>
      <path d="M16 -6 L12 16" ${ST}/>
    </g></g>`),
    "bw-single-bridge": () => wrap(`<g transform="translate(50 72)"><g>${rot("10; -8; 10", "1.55s")}
      <path d="M-26 6 L20 -8" ${ST}/>
      <circle cx="-32" cy="8" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <path d="M20 -8 L26 16" ${ST}/>
      <path d="M14 -6 L28 -18" ${ST}/>
    </g></g>`),
    "bw-hip-thrust": () => wrap(`<rect x="14" y="54" width="20" height="6" fill="none" stroke="${MUTED}"/>
      <g transform="translate(50 66)"><g>${rot("6; -8; 6", "1.55s")}
        <path d="M-22 0 L20 -4" ${ST}/>
        <circle cx="-28" cy="0" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
        <path d="M20 -4 L26 16" ${ST}/>
      </g></g>`),
    "bw-plank": () => wrap(floorPerson("plank")),
    "bw-side-plank": () => wrap(`<g transform="translate(50 60)"><g>${rot("-3; 3; -3", "2.2s")}
      <path d="M-28 0 L24 2" ${ST}/>
      <circle cx="-34" cy="-2" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <path d="M-22 0 L-26 16" ${ST}/>
      <path d="M0 1 L0 -14" ${ST}/>
      <path d="M24 2 L30 16" ${ST}/>
    </g></g>`),
    "bw-hollow": () => wrap(`<g transform="translate(50 62)"><g>${rot("-8; 8; -8", "2s")}
      <path d="M-24 0 C-4 -8 8 -8 28 0" ${ST}/>
      <circle cx="-30" cy="0" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
    </g></g>`),
    "bw-dead-bug": () => wrap(`<g transform="translate(50 62)">
      <path d="M-18 0 L16 0" ${ST}/>
      <circle cx="-24" cy="0" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <g transform="translate(-8 0)"><g>${rot("-24; 20; -24", "1.55s")}<path d="M0 0 L-12 -12" ${ST}/></g></g>
      <g transform="translate(6 0)"><g>${rot("20; -24; 20", "1.55s")}<path d="M0 0 L12 -12" ${ST}/></g></g>
      <g transform="translate(16 0)"><g>${rot("16; -30; 16", "1.55s")}<path d="M0 0 L16 6" ${ST}/></g></g>
    </g>`),
    "bw-bird-dog": () => wrap(`<g transform="translate(50 58)">
      <path d="M-20 0 L20 0" ${ST}/>
      <circle cx="-28" cy="-2" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <g transform="translate(-14 0)"><g>${rot("6; -12; 6", "2s")}<path d="M0 0 L-16 -8" ${ST}/></g></g>
      <path d="M-10 0 L-8 16" ${ST}/>
      <path d="M12 0 L14 16" ${ST}/>
      <g transform="translate(18 0)"><g>${rot("6; -12; 6", "2s")}<path d="M0 0 L16 -8" ${ST}/></g></g>
    </g>`),
    "bw-hanging-knee": () => wrap(`<path d="M22 13 H78" stroke="${MUTED}" stroke-width="2.2" stroke-linecap="round"/>
      <g transform="translate(50 14)">
        <path d="M-16 0 L0 20 L16 0" ${ST}/>
        <path d="M0 20 L0 32" ${ST}/>
        <circle cx="0" cy="12" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
        <g transform="translate(0 32)"><g>${rot("10; -42; 10", "1.45s")}
          <path d="M-6 0 L-4 12" ${ST}/>
          <path d="M6 0 L4 12" ${ST}/>
        </g></g>
      </g>`),
    "bw-situp": () => wrap(`<g transform="translate(50 66)"><g>${rot("22; -6; 22", "1.55s")}
      <path d="M-8 -16 L16 4 L36 4" ${ST}/>
      <circle cx="-12" cy="-22" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
    </g></g>`),
    "bw-leg-raise": () => wrap(`<g transform="translate(50 68)">
      <path d="M-26 0 L8 0" ${ST}/>
      <circle cx="-32" cy="0" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <g transform="translate(8 0)"><g>${rot("8; -55; 8", "1.45s")}<path d="M0 0 L26 0" ${ST}/></g></g>
    </g>`),
    "bw-burpee": () => wrap(person({
      dur: "0.95s", hips: "0 7; 0 -6; 0 7",
      torso: "8; 2; 8",
      armL: "16; -80; 16", armR: "-16; 80; -16",
      legL: "30; 4; 30", legR: "-30; -4; -30",
      shinL: "-36; -6; -36", shinR: "36; 6; 36"
    })),
    "bw-mountain": () => wrap(floorPerson("mountain")),
    "bw-jump-squat": () => wrap(person({
      dur: "0.9s", hips: "0 8; 0 -10; 0 8",
      armL: "16; -80; 16", armR: "-16; 80; -16",
      legL: "28; -4; 28", legR: "-28; 4; -28",
      shinL: "-32; 4; -32", shinR: "32; -4; 32"
    })),
    "bw-skater": () => wrap(person({
      dur: "0.9s", torso: "-8; 8; -8", hips: "-6 2; 6 2; -6 2",
      armL: "-40; 20; -40", armR: "20; -40; 20",
      legL: "18; -8; 18", legR: "-22; 16; -22"
    })),
    "bw-high-knees": () => wrap(person({
      dur: "0.45s",
      armL: "-28; 22; -28", armR: "22; -28; 22",
      legL: "8; -48; 8", legR: "-48; 8; -48",
      shinL: "-8; -10; -8", shinR: "-10; -8; -10"
    })),
    "bw-jumping-jack": () => wrap(person({
      dur: "0.7s",
      armL: "10; -120; 10", armR: "-10; 120; -10",
      legL: "6; 24; 6", legR: "-6; -24; -6"
    })),
    "bw-bear-crawl": () => wrap(floorPerson("mountain")),
    "bw-crab-walk": () => wrap(`<g transform="translate(50 58)"><g>${slide("-3 0; 4 0; -3 0", "0.85s")}
      <path d="M20 -4 L-20 2" ${ST}/>
      <circle cx="26" cy="-8" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <path d="M16 -2 L20 16" ${ST}/>
      <path d="M-16 2 L-20 16" ${ST}/>
      <path d="M8 0 L10 16" ${ST}/>
      <path d="M-8 2 L-6 16" ${ST}/>
    </g></g>`),
    "bw-inchworm": () => wrap(`<g transform="translate(50 62)"><g>${slide("0 0; 4 0; 0 0", "2s")}
      <path d="M-22 -6 C-4 -18 10 4 24 10" ${ST}/>
      <circle cx="-28" cy="-8" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <path d="M-20 -6 L-24 16" ${ST}/>
      <path d="M24 10 L30 16" ${ST}/>
    </g></g>`),
    "bw-world-greatest": () => wrap(person({
      dur: "2.1s", torso: "8; -8; 8",
      armR: "-20; -120; -20", armL: "16; 10; 16",
      legL: "26; 10; 26", legR: "-20; -8; -20"
    })),
    "bw-hip-opener": () => wrap(person({
      dur: "2s", wide: true, torso: "4; -4; 4",
      legL: "22; -8; 22", legR: "-8; 22; -8",
      armL: "14; 10; 14", armR: "-14; -10; -14"
    })),
    "bw-cat-cow": () => wrap(`<g transform="translate(50 58)"><g>${rot("-8; 8; -8", "2s")}
      <path d="M-22 0 C-4 -12 8 -12 24 2" ${ST}/>
      <circle cx="-28" cy="-2" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <path d="M-16 0 L-20 16" ${ST}/>
      <path d="M18 1 L24 16" ${ST}/>
    </g></g>`),
    "bw-thoracic-rot": () => wrap(`<g transform="translate(50 62)">
      <path d="M-16 4 L20 4" ${ST}/>
      <circle cx="-2" cy="-14" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <path d="M-8 4 L-6 16" ${ST}/>
      <g transform="translate(4 4)"><g>${rot("0; -70; 0", "2s")}<path d="M0 0 L16 -10" ${ST}/></g></g>
    </g>`),
    "bw-down-dog": () => wrap(`<g transform="translate(50 62)"><g>${rot("-2; 4; -2", "2.3s")}
      <path d="M-18 -6 L0 -28 L22 6" ${ST}/>
      <circle cx="-24" cy="-4" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <path d="M-18 -6 L-24 16" ${ST}/>
      <path d="M22 6 L28 18" ${ST}/>
    </g></g>`),
    "bw-couch-stretch": () => wrap(`<rect x="66" y="16" width="7" height="72" fill="none" stroke="${MUTED}"/>` + person({
      dur: "2.4s", torso: "4; 2; 4",
      legR: "-8; -14; -8", shinR: "-40; -48; -40",
      armL: "12; 10; 12", armR: "-12; -10; -12"
    })),
    "bw-child": () => wrap(`<g transform="translate(50 70)"><g>${slide("0 0; 0 -2; 0 0", "3s")}
      <path d="M-18 -6 C-2 8 12 10 26 4" ${ST}/>
      <circle cx="-24" cy="-8" r="5.5" fill="none" stroke="${INK}" stroke-width="1.8"/>
    </g></g>`)
  };

  window.BellworkArt = {
    svg(id) {
      return (poses[id] || poses["bw-squat"])();
    }
  };
})();
