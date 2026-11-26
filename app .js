(function () {
  var e = React.createElement;
  var useState = React.useState, useReducer = React.useReducer, useEffect = React.useEffect, useRef = React.useRef;
  var MAX = 6;
  var WORDS = {
    Animal: ["giraffe","penguin","dolphin","leopard","octopus","buffalo","hedgehog","flamingo","kangaroo","squirrel","cheetah","gorilla","raccoon","panther","peacock","jaguar","lobster","walrus","chameleon","porcupine","cat"],
    
    Place: ["iceland","village","desert","glacier","volcano","island","canyon","jungle","lighthouse","harbor","meadow","savanna","tundra","plateau","lagoon","fortress","cavern","airport","stadium","museum"],
    Tech: ["keyboard","network","browser","compiler","database","algorithm","function","variable","terminal","internet","software","hardware","processor","bandwidth","firewall","developer","password","server","router","pixel"],
    Food: ["pancake","avocado","noodles","pretzel","mushroom","broccoli","cinnamon","chocolate","sandwich","blueberry","omelette","dumpling","burrito","lasagna","pistachio","croissant","popcorn","spinach","waffle","cheesecake"],
    Weather: ["rainbow","thunder","blizzard","tornado","monsoon","drizzle","lightning","sunshine","hailstorm","breeze","hurricane","snowfall","humidity","overcast","whirlwind","frost","drought","cyclone"],
    Object: ["umbrella","backpack","notebook","compass","telescope","lantern","bicycle","hammock","suitcase","calendar","flashlight","envelope","scissors","blanket","mirror","candle","toolbox","clipboard"],
    Sport: ["football","cricket","tennis","hockey","cycling","boxing","archery","surfing","swimming","badminton","marathon","gymnastics","volleyball","wrestling","skating","rowing","baseball","fencing"],
    Music: ["guitar","piano","violin","trumpet","drums","melody","rhythm","harmony","orchestra","saxophone","ukulele","chorus","concert","festival","lullaby","cello","flute","harp"],
    Space: ["galaxy","planet","comet","asteroid","nebula","eclipse","satellite","astronaut","telescope","orbit","meteor","universe","rocket","supernova","gravity","cosmos","jupiter","saturn"],
    Ocean: ["dolphin","seaweed","coral","lobster","whale","shipwreck","lighthouse","anchor","seahorse","jellyfish","current","tide","reef","harbor","submarine","starfish","octopus"],
    Country: ["india","brazil","canada","egypt","germany","japan","mexico","norway","portugal","thailand","vietnam","argentina","australia","switzerland","indonesia","nigeria","kenya"],
    Profession: ["teacher","doctor","pilot","farmer","engineer","chef","painter","plumber","lawyer","dentist","architect","scientist","carpenter","electrician","journalist","musician","barber"],
    Fruit: ["mango","banana","papaya","apricot","cherry","pineapple","strawberry","pomegranate","watermelon","blueberry","lychee","guava","coconut","raspberry","tangerine","kiwi"],
    Vehicle: ["bicycle","scooter","tractor","trolley","airplane","submarine","ambulance","motorcycle","helicopter","skateboard","sailboat","rickshaw","bulldozer","ferry","tram"]
  };
  var CATS = ["All"].concat(Object.keys(WORDS));
  var ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  function pickWord(filter, lastWord) {
    var pool = [];
    Object.keys(WORDS).forEach(function (c) {
      if (filter === "All" || filter === c) WORDS[c].forEach(function (w) { if (w !== lastWord) pool.push({ word: w, cat: c }); });
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function newState(pick, id) {
    return { id: id, word: pick.word, cat: pick.cat, guessed: [], hints: 0,
      msg: { t: "Pick a letter to begin.", k: "" }, shake: { l: "", n: 0 } };
  }
  function derive(s) {
    var wrong = s.guessed.filter(function (l) { return s.word.indexOf(l) === -1; });
    var mistakes = wrong.length + s.hints;
    var solved = s.word.split("").every(function (c) { return s.guessed.indexOf(c) !== -1; });
    return { wrong: wrong, mistakes: mistakes, left: MAX - mistakes,
      outcome: solved ? "won" : mistakes >= MAX ? "lost" : "play" };
  }
  function reducer(s, a) {
    if (a.type === "new") return newState(a.pick, s.id + 1);
    var d = derive(s);
    if (d.outcome !== "play") return s;
    if (a.type === "guess") {
      var L = a.l.toUpperCase();
      if (s.guessed.indexOf(a.l) !== -1)
        return Object.assign({}, s, { msg: { t: "Already tried " + L + ". No life lost.", k: "" }, shake: { l: a.l, n: s.shake.n + 1 } });
      var hit = s.word.indexOf(a.l) !== -1, n = s.word.split(a.l).length - 1, left = d.left - (hit ? 0 : 1);
      return Object.assign({}, s, {
        guessed: s.guessed.concat(a.l),
        msg: hit ? { t: n + (n === 1 ? " match for " : " matches for ") + L + ".", k: "good" }
                 : { t: "No " + L + ". " + left + (left === 1 ? " life left." : " lives left."), k: "bad" }
      });
    }
    if (a.type === "hint" && d.left > 1) {
      var open = s.word.split("").filter(function (c, i, arr) { return s.guessed.indexOf(c) === -1 && arr.indexOf(c) === i; });
      var l = open[Math.floor(Math.random() * open.length)];
      return Object.assign({}, s, { guessed: s.guessed.concat(l), hints: s.hints + 1,
        msg: { t: "Hint: " + l.toUpperCase() + " is in the word. That cost 1 life.", k: "bad" } });
    }
    return s;
  }

  function loadStats() {
    var base = { wins: 0, losses: 0, streak: 0, best: 0 };
    try { var r = localStorage.getItem("hangman-stats"); if (r) return Object.assign(base, JSON.parse(r)); } catch (x) {}
    return base;
  }

  function Header(p) {
    var s = p.stats;
    function pill(label, v) { return e("div", { className: "pill", key: label }, label, e("b", null, v)); }
    return e("header", { className: "head" },
      e("div", null, e("p", { className: "eyebrow" }, "The word guessing game"), e("h1", null, "Hangman")),
      e("div", { className: "stats", "aria-label": "Your record" }, pill("Wins", s.wins), pill("Losses", s.losses), pill("Streak", s.streak), pill("Best", s.best)));
  }

  var PARTS = [
    ["circle", { cx: 160, cy: 82, r: 18 }],
    ["path", { d: "M160 100 V168" }],
    ["path", { d: "M160 120 L134 148" }],
    ["path", { d: "M160 120 L186 148" }],
    ["path", { d: "M160 168 L138 212" }],
    ["path", { d: "M160 168 L182 212" }]
  ];
  function Gallows(p) {
    return e("svg", { viewBox: "0 0 240 270", role: "img", "aria-label": "Gallows with " + p.mistakes + " of " + MAX + " parts drawn" },
      e("defs", null, e("linearGradient", { id: "tideGrad", x1: 0, y1: 0, x2: 1, y2: 1 },
        e("stop", { offset: "0%", stopColor: "var(--grad-a)" }), e("stop", { offset: "100%", stopColor: "var(--grad-b)" }))),
      e("ellipse", { className: "ground", cx: 100, cy: 256, rx: 90, ry: 7 }),
      e("path", { className: "frame", d: "M30 248 H170 M70 248 V28 H160 M70 76 L118 28 M160 28 V64" }),
      PARTS.map(function (pt, i) {
        return e(pt[0], Object.assign({ key: i, pathLength: 1, className: "part" + (i < p.mistakes ? " on" : "") }, pt[1]));
      }));
  }

  function Word(p) {
    var s = p.s;
    return e("div", { className: "word", role: "img", "aria-label": "Word: " + s.word.split("").map(function (c) { return s.guessed.indexOf(c) !== -1 || p.over ? c : "blank"; }).join(" ") },
      s.word.split("").map(function (c, i) {
        var shown = s.guessed.indexOf(c) !== -1;
        var cls = "tile" + (shown ? " on" : "") + (shown && c === p.last ? " pop" : "") + (!shown && p.over ? " reveal" : "");
        return e("div", { className: cls, key: s.id + "-" + i + (shown ? "s" : "h") }, e("span", null, shown || p.over ? c : ""));
      }));
  }

  function Keyboard(p) {
    return e("div", { className: "keys" }, ROWS.map(function (r) {
      return e("div", { className: "krow", key: r }, r.split("").map(function (c) {
        var used = p.s.guessed.indexOf(c) !== -1, hit = used && p.s.word.indexOf(c) !== -1;
        var cls = "key" + (used ? (hit ? " hit" : " miss") : "") + (p.s.shake.l === c ? " shake" : "");
        return e("button", { key: c + (p.s.shake.l === c ? p.s.shake.n : ""), type: "button", className: cls, disabled: used || p.over,
          "aria-label": "Letter " + c, onClick: function () { p.dispatch({ type: "guess", l: c }); } }, c);
      }));
    }));
  }

  function App() {
    var f = useState("All"), filter = f[0], setFilter = f[1];
    var r = useReducer(reducer, null, function () { return newState(pickWord("All", ""), 1); });
    var s = r[0], dispatch = r[1];
    var st = useState(loadStats), stats = st[0], setStats = st[1];
    var d = derive(s), over = d.outcome !== "play";
    var againRef = useRef(null);

    function start(cat) { dispatch({ type: "new", pick: pickWord(cat, s.word) }); }
    function chooseCat(c) { setFilter(c); start(c); }

    useEffect(function () {
      function onKey(ev) {
        if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
        if (/^[a-zA-Z]$/.test(ev.key)) dispatch({ type: "guess", l: ev.key.toLowerCase() });
      }
      function onMove(ev) {
        var root = document.documentElement.style;
        root.setProperty("--mx", ev.clientX + "px"); root.setProperty("--my", ev.clientY + "px");
      }
      document.addEventListener("keydown", onKey);
      document.addEventListener("pointermove", onMove);
      return function () { document.removeEventListener("keydown", onKey); document.removeEventListener("pointermove", onMove); };
    }, []);

    useEffect(function () {
      if (d.outcome === "play") return;
      setStats(function (p) {
        var won = d.outcome === "won", streak = won ? p.streak + 1 : 0;
        return { wins: p.wins + (won ? 1 : 0), losses: p.losses + (won ? 0 : 1), streak: streak, best: Math.max(p.best, streak) };
      });
      if (againRef.current) againRef.current.focus({ preventScroll: true });
    }, [s.id, d.outcome]);
    useEffect(function () { try { localStorage.setItem("hangman-stats", JSON.stringify(stats)); } catch (x) {} }, [stats]);

    var lastGuess = s.guessed.length ? s.guessed[s.guessed.length - 1] : "";
    var note = d.outcome === "won" ? { t: "Solved with " + d.mistakes + " of " + MAX + " lives spent.", k: "good" }
      : d.outcome === "lost" ? { t: "Out of lives. The word was " + s.word.toUpperCase() + ".", k: "bad" } : s.msg;

    return e(React.Fragment, null,
      e("div", { className: "bg", "aria-hidden": "true" },
        e("div", { className: "blob b1" }), e("div", { className: "blob b2" }), e("div", { className: "blob b3" }), e("div", { className: "blob b4" }), e("div", { className: "grain" })),
      e("div", { className: "app" },
        e(Header, { stats: stats }),
        e("div", { className: "sheet" },
          e("section", { className: "glass panel drawing" + (d.outcome === "won" ? " won" : ""), "aria-label": "Gallows" },
            e(Gallows, { mistakes: d.mistakes }),
            e("div", { className: "rev" },
              e("span", null, d.left + (d.left === 1 ? " life left" : " lives left")),
              e("div", { className: "pips", "aria-hidden": "true" }, Array.from({ length: MAX }, function (_, i) {
                return e("span", { key: i, className: "pip" + (i >= d.left ? " gone" : "") });
              }))),
            over && e("div", { className: "banner " + (d.outcome === "won" ? "win" : "lose"), "aria-hidden": "true" }, d.outcome === "won" ? "Solved" : "Game over")),
          e("section", { className: "glass panel", "aria-label": "Play area" },
            e("div", { className: "cats", role: "radiogroup", "aria-label": "Category" }, CATS.map(function (c) {
              return e("button", { key: c, type: "button", role: "radio", "aria-checked": filter === c, className: "chip", onClick: function () { chooseCat(c); } }, c);
            })),
            e("p", { className: "clue" }, "Clue: ", e("b", null, s.cat), " · " + s.word.length + " letters"),
            e(Word, { s: s, over: over, last: lastGuess }),
            e("p", { className: "note " + note.k, role: "status", "aria-live": "polite" }, note.t),
            e(Keyboard, { s: s, over: over, dispatch: dispatch }),
            e("div", { className: "actions" },
              over ? e("button", { type: "button", className: "btn", ref: againRef, onClick: function () { start(filter); } }, "Play again")
                   : e("button", { type: "button", className: "btn ghost", onClick: function () { start(filter); } }, "New word"),
              e("button", { type: "button", className: "btn ghost", disabled: over || d.left <= 1, onClick: function () { dispatch({ type: "hint" }); } }, "Hint (−1 life)"),
              e("p", { className: "hint" }, "You can also type on your keyboard. Repeating a letter costs nothing."))))));
  }

  ReactDOM.createRoot(document.getElementById("root")).render(e(App));
})();
