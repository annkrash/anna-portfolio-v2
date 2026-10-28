  // Шапка: тень при прокрутке, тёмный режим над тёмным разделом, активный пункт меню
  const top_ = document.querySelector(".top"), dark = document.querySelector(".dark");
  const onScroll = () => {
    top_.classList.toggle("scrolled", scrollY > 10);
    const r = dark.getBoundingClientRect();
    top_.classList.toggle("on-dark", r.top < 60 && r.bottom > 60);
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const links = [...document.querySelectorAll(".menu a")];
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.toggleAttribute("aria-current", a.hash === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("section[id]").forEach(s => secObs.observe(s));

  const burger = document.querySelector(".burger");
  burger.onclick = () => { const o = top_.classList.toggle("open"); burger.setAttribute("aria-expanded", o); burger.textContent = o ? burger.dataset.close : burger.dataset.menu; };
  document.querySelectorAll(".menu a").forEach(a => a.addEventListener("click", () => { top_.classList.remove("open"); burger.textContent = burger.dataset.menu; }));

  // Появление при прокрутке
  const rvObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); rvObs.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".rv").forEach(el => rvObs.observe(el));

  // Превью при наведении на пункт содержания
  const peek = document.querySelector(".peek");
  if (matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-peek]").forEach(a => {
      a.addEventListener("mouseenter", () => { peek.src = a.dataset.peek; peek.classList.add("on"); });
      a.addEventListener("mouseleave", () => peek.classList.remove("on"));
      a.addEventListener("mousemove", e => { peek.style.left = e.clientX + 170 + "px"; peek.style.top = e.clientY + "px"; });
    });
  }

  // Подрамники: перетаскивание мышью
  document.querySelectorAll(".pan").forEach(p => {
    let x0 = 0, s0 = 0, down = false;
    p.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; p.moved = false; x0 = e.clientX; s0 = p.scrollLeft; });
    addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { p.moved = true; p.classList.add("drag"); } p.scrollLeft = s0 - dx; });
    addEventListener("pointerup", () => { down = false; p.classList.remove("drag"); });
  });

  // Просмотрщик
  const items = [...document.querySelectorAll("main img[data-full]")].filter((im, i, a) => a.findIndex(o => o.dataset.full === im.dataset.full) === i);
  items.forEach(im => im.classList.add("zoomable"));
  const lb = document.querySelector(".lb"), stage = lb.querySelector(".lb-stage"), big = stage.querySelector("img");
  const count = lb.querySelector(".lb-count"), cap = lb.querySelector(".lb-cap");
  let cur = 0, lastFocus = null;

  function show(i) {
    cur = (i + items.length) % items.length;
    unzoom();
    const it = items[cur];
    big.src = it.currentSrc || it.src;
    const hi = new Image();
    hi.onload = () => { if (items[cur] === it) big.src = hi.src; };
    hi.src = it.dataset.full;
    big.alt = it.alt; cap.textContent = it.alt;
    count.textContent = `${cur + 1} / ${items.length}`;
  }
  function open(i) {
    lastFocus = document.activeElement;
    lb.classList.add("open"); document.body.style.overflow = "hidden";
    show(i); lb.querySelector(".lb-close").focus();
    history.pushState({ lb: 1 }, "");
  }
  function close(fromHistory) {
    if (!lb.classList.contains("open")) return;
    lb.classList.remove("open"); document.body.style.overflow = "";
    unzoom(); lastFocus?.focus();
    if (!fromHistory && history.state?.lb) history.back();
  }
  function zoom(cx, cy) {
    const r = big.getBoundingClientRect(), ratio = big.naturalWidth / big.naturalHeight || 1.4;
    const fx = cx != null ? (cx - r.left) / r.width : .5, fy = cy != null ? (cy - r.top) / r.height : .5;
    const w = Math.max(r.width * 2.2, stage.clientHeight * ratio, 1200);
    lb.classList.add("zoomed"); big.style.width = w + "px";
    stage.scrollLeft = fx * w - stage.clientWidth / 2;
    stage.scrollTop = fy * (w / ratio) - stage.clientHeight / 2;
  }
  function unzoom() { lb.classList.remove("zoomed"); big.style.width = ""; stage.scrollTo(0, 0); }

  document.addEventListener("click", e => {
    const im = e.target.closest("main img[data-full]");
    if (im) {
      if (im.closest(".pan")?.moved) return;
      if (im.closest(".strip")) return;
      e.preventDefault();
      open(items.findIndex(o => o.dataset.full === im.dataset.full));
    }
    const b = e.target.closest("[data-open]");
    if (b) open(items.findIndex(o => o.dataset.full.includes("/" + b.dataset.open + "-")));
  });
  big.addEventListener("click", e => lb.classList.contains("zoomed") ? unzoom() : zoom(e.clientX, e.clientY));
  lb.querySelector(".lb-zoom").onclick = () => lb.classList.contains("zoomed") ? unzoom() : zoom();
  lb.querySelector(".lb-close").onclick = () => close();
  lb.querySelector(".lb-prev").onclick = () => show(cur - 1);
  lb.querySelector(".lb-next").onclick = () => show(cur + 1);
  stage.addEventListener("click", e => { if (e.target === stage) close(); });
  addEventListener("popstate", () => close(true));
  addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight" && !lb.classList.contains("zoomed")) show(cur + 1);
    else if (e.key === "ArrowLeft" && !lb.classList.contains("zoomed")) show(cur - 1);
  });
  let sx = null, sy = 0;
  stage.addEventListener("touchstart", e => { sx = e.touches.length === 1 && !lb.classList.contains("zoomed") ? e.touches[0].clientX : null; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", e => {
    if (sx == null || (window.visualViewport && visualViewport.scale > 1.01)) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(cur + (dx < 0 ? 1 : -1));
    sx = null;
  });
