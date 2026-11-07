/* =====================================================
   Wristia LP — wristia.js（外部ライブラリなし）
   ===================================================== */

/* ===== LINKS（URLはここだけに集約） ===== */
const LINKS = { store:'', line:'https://line.me/R/ti/p/@example', gas:'', privacy:'https://example.com/privacy' };

/* ===== 購入先モール =====
   「通販サイトで購入」ボタンは、押すと［アマゾン／楽天］のメニューを表示するだけで、どこにも遷移しません。
   遷移先を設定する場合は、下の URL を入れてください（入れたモールのメニュー項目だけ、新しいタブで開きます）。 */
const MALLS = {
  '5cm': { amazon:'', rakuten:'' },
  '6cm': { amazon:'', rakuten:'' }
};

/* ===== 計測 ===== */
window.dataLayer = window.dataLayer || [];
function track(event, params){ dataLayer.push(Object.assign({event}, params||{})); }

(function(){
  'use strict';
  var $ = function(s, r){ return (r||document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 購入メニューを閉じる（追従CTAの表示制御からも使う） */
  var closeBuy = function(b){
    var t = $('.buy-toggle', b), m = $('.buy-menu', b);
    if (m) { m.hidden = true; }
    if (t) { t.setAttribute('aria-expanded', 'false'); }
  };

  /* ----- 1. リンク設定 ----- */
  try {
    if (!LINKS.store) { $$('[data-store]').forEach(function(el){ el.remove(); }); }
    $$('[data-link]').forEach(function(el){
      var url = LINKS[el.dataset.link];
      if (!url) { return; }
      el.setAttribute('href', url);
      if (/^https?:\/\//.test(url) && url.indexOf(location.origin) !== 0) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      }
    });
  } catch (e) { console.error(e); }

  /* ----- 1b. 購入ボタン：アマゾン／楽天のメニュー表示のみ（外部へは遷移しない） ----- */
  try {
    var buys = $$('.buy');
    var closeAll = function(except){ buys.forEach(function(b){ if (b !== except) { closeBuy(b); } }); };
    buys.forEach(function(b){
      var t = $('.buy-toggle', b), m = $('.buy-menu', b);
      if (!t || !m) { return; }
      t.addEventListener('click', function(){
        var wasOpen = t.getAttribute('aria-expanded') === 'true';
        closeAll(b);
        m.hidden = wasOpen;
        t.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
      });
      $$('.buy-opt', m).forEach(function(opt){
        opt.addEventListener('click', function(){
          var mall = opt.dataset.mall, url = (MALLS[b.dataset.size] || {})[mall];
          track('mall_select', { size: b.dataset.size, mall: mall });
          if (url) { window.open(url, '_blank', 'noopener'); }  // URL未設定の間は何も開かない
          closeBuy(b);
        });
      });
    });
    document.addEventListener('pointerdown', function(ev){
      if (!(ev.target.closest && ev.target.closest('.buy'))) { closeAll(null); }
    });
    document.addEventListener('keydown', function(ev){
      if (ev.key !== 'Escape') { return; }
      buys.forEach(function(b){
        var t = $('.buy-toggle', b);
        if (t && t.getAttribute('aria-expanded') === 'true') { closeBuy(b); t.focus(); }
      });
    });
  } catch (e) { console.error(e); }

  /* ----- 2. CTAクリック計測 ----- */
  try {
    document.addEventListener('click', function(ev){
      var el = ev.target.closest && ev.target.closest('[data-cta]');
      if (el) { track('cta_click', { cta_id: el.dataset.cta }); }
    });
  } catch (e) { console.error(e); }

  /* ----- 2. スクロール深度 ----- */
  try {
    var marks = [25, 50, 70, 90], sent = {}, ticking = false;
    var checkDepth = function(){
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 100;
      marks.forEach(function(m){
        if (!sent[m] && pct >= m) { sent[m] = true; track('scroll_' + m); }
      });
    };
    window.addEventListener('scroll', function(){
      if (!ticking) { ticking = true; requestAnimationFrame(checkDepth); }
    }, { passive: true });
  } catch (e) { console.error(e); }

  /* ----- 2. 滞在60秒（非表示中は数えない） ----- */
  try {
    var visibleSec = 0, engaged = false;
    var timer = setInterval(function(){
      if (document.visibilityState !== 'visible') { return; }
      visibleSec++;
      if (!engaged && visibleSec >= 60) { engaged = true; track('engaged_60s'); clearInterval(timer); }
    }, 1000);
  } catch (e) { console.error(e); }

  /* ----- 3. 追従CTA ----- */
  try {
    var sticky = $('#sticky'), fvCta = $('#fv-cta'), buy = $('#buy'), fin = $('#final');
    if (sticky && fvCta && 'IntersectionObserver' in window) {
      var st = { fvPassed: false, buy: false, fin: false };
      var render = function(){
        var show = st.fvPassed && !st.buy && !st.fin;
        sticky.classList.toggle('is-show', show);
        sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
        $$('a, button', sticky).forEach(function(a){ a.tabIndex = show ? 0 : -1; });
        if (!show) { $$('.buy', sticky).forEach(closeBuy); }
      };
      new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          st.fvPassed = !en.isIntersecting && en.boundingClientRect.top < 0;
        });
        render();
      }).observe(fvCta);
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (en.target === buy) { st.buy = en.isIntersecting; }
          if (en.target === fin) { st.fin = en.isIntersecting; }
        });
        render();
      });
      if (buy) { io.observe(buy); }
      if (fin) { io.observe(fin); }
    }
  } catch (e) { console.error(e); }

  /* ----- 4. 横スクロール列のドット ----- */
  try {
    $$('[data-dots-for]').forEach(function(box){
      var track = document.getElementById(box.dataset.dotsFor);
      if (!track) { return; }
      var items = Array.prototype.slice.call(track.children);
      var label = track.getAttribute('aria-label') || '';
      var dots = items.map(function(item, i){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'dot';
        b.setAttribute('aria-label', (label.replace(/（.*?）/, '')) + ' ' + (i + 1) + '枚目へ');
        b.addEventListener('click', function(){
          track.scrollTo({ left: item.offsetLeft - items[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
        box.appendChild(b);
        return b;
      });
      var setCur = function(){
        var step = items.length > 1 ? (items[1].offsetLeft - items[0].offsetLeft) : (items[0].offsetWidth || 1);
        var maxScroll = track.scrollWidth - track.clientWidth;
        var idx = track.scrollLeft >= maxScroll - 2 ? items.length - 1 : Math.round(track.scrollLeft / step);
        idx = Math.max(0, Math.min(items.length - 1, idx));
        dots.forEach(function(d, i){ d.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
      };
      var raf = false;
      track.addEventListener('scroll', function(){
        if (!raf) { raf = true; requestAnimationFrame(function(){ raf = false; setCur(); }); }
      }, { passive: true });
      setCur();
    });
  } catch (e) { console.error(e); }

  /* ----- 5. デモ動画 / 代替デモ ----- */
  try {
    var demo = $('#demo'), video = $('#demo-video'), toggle = $('#demo-toggle');
    if (demo && video) {
      var saveData = !!(navigator.connection && navigator.connection.saveData);
      var played = false, lastT = 0;
      var useFallback = function(){
        if (demo.classList.contains('is-fallback')) { return; }
        demo.classList.add('is-fallback');
        try { video.pause(); video.removeAttribute('autoplay'); } catch (_) {}
      };
      var source = video.querySelector('source');
      video.addEventListener('error', useFallback);
      if (source) { source.addEventListener('error', useFallback); }
      video.addEventListener('playing', function(){
        if (!played) { played = true; track('video_play'); }
      });
      video.addEventListener('timeupdate', function(){
        if (video.currentTime + 0.5 < lastT) { track('video_complete'); }
        lastT = video.currentTime;
      });
      var setPaused = function(p){
        demo.classList.toggle('is-paused', p);
        toggle.setAttribute('aria-pressed', p ? 'true' : 'false');
        toggle.setAttribute('aria-label', p ? 'デモを再生' : 'デモを一時停止');
      };
      // 動きを減らす設定／通信量節約時は自動再生しない（動画は非表示にせず、ポスター＋再生ボタンで見せる）
      if (reduceMotion || saveData) {
        video.removeAttribute('autoplay');
        video.autoplay = false;
        video.preload = 'none';
        video.pause();
        setPaused(true);
      }
      toggle.addEventListener('click', function(){
        if (demo.classList.contains('is-fallback')) {
          setPaused(!demo.classList.contains('is-paused'));
          return;
        }
        if (video.paused) {
          if (video.preload === 'none') { video.preload = 'auto'; }
          var p = video.play();
          if (p && p.catch) { p.catch(function(){ useFallback(); }); }
          setPaused(false);
        } else {
          video.pause();
          setPaused(true);
        }
      });
    }
  } catch (e) { console.error(e); }

  /* ----- 5b. FV動画：自動再生・ループ（画面外では停止、戻ったら再開） ----- */
  try {
    var fvHero = $('#hero'), fvVideo = $('#fv-video'), fvToggle = $('#fv-toggle');
    if (fvHero && fvVideo && fvToggle) {
      var fvSaveData = !!(navigator.connection && navigator.connection.saveData);
      var fvUserPaused = false, fvInView = true, fvSent = false;
      fvVideo.muted = true;      // iOS/Safari の自動再生条件
      fvVideo.loop = true;       // リピート再生
      var fvSetPaused = function(p){
        fvHero.classList.toggle('is-paused', p);
        fvToggle.setAttribute('aria-pressed', p ? 'true' : 'false');
        fvToggle.setAttribute('aria-label', p ? '映像を再生' : '映像を一時停止');
      };
      var fvPlay = function(){
        var pr = fvVideo.play();
        if (pr && pr.catch) { pr.catch(function(){ /* 自動再生がブロックされた場合は、最初のタップで再試行 */ fvSetPaused(true); }); }
      };
      if (reduceMotion || fvSaveData) {
        // 動きを減らす設定／通信量節約時は自動再生しない（ポスター表示、ボタンで再生可）
        fvVideo.removeAttribute('autoplay');
        fvVideo.preload = 'none';
        fvVideo.pause();
        fvUserPaused = true;
        fvSetPaused(true);
      } else {
        fvVideo.addEventListener('playing', function(){
          fvSetPaused(false);
          if (!fvSent) { fvSent = true; track('fv_video_play'); }
        });
        // 低電力モード等でブロックされたら、最初のタッチ／スクロールで再生
        var fvUnlock = function(ev){
          if (ev && ev.target && ev.target.closest && ev.target.closest('#fv-toggle')) { return; } // ボタン操作は別処理
          document.removeEventListener('touchstart', fvUnlock);
          document.removeEventListener('click', fvUnlock);
          if (fvVideo.paused && !fvUserPaused && fvInView) { fvPlay(); }
        };
        document.addEventListener('touchstart', fvUnlock, { passive: true });
        document.addEventListener('click', fvUnlock);
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(function(entries){
            entries.forEach(function(en){
              fvInView = en.isIntersecting;
              if (fvInView && !fvUserPaused) { fvPlay(); }
              else if (!fvInView) { fvVideo.pause(); }
            });
          }, { threshold: 0.25 }).observe(fvHero);
        } else {
          fvPlay();
        }
      }
      fvToggle.addEventListener('click', function(){
        if (fvVideo.paused) {
          fvUserPaused = false;
          if (fvVideo.preload === 'none') { fvVideo.preload = 'auto'; }
          fvPlay();
          fvSetPaused(false);
        } else {
          fvUserPaused = true;
          fvVideo.pause();
          fvSetPaused(true);
        }
      });
    }
  } catch (e) { console.error(e); }

  /* ----- 5c. FVパネル：シーンに合わせた背景画の切替＋文字色の切替 -----
     ・テキスト側の背景は、動画の背景（人物・リストウォッチを除いた部分）を上へ延ばした画像（images/FV_bg_*.jpg）
     ・動画のシーンが変わる秒数で、背景画をクロスフェードし、文字色（tone: light=濃紺 / dark=白）も切り替える
     ・動画を差し替えたら、下の FV_SCENES（秒）と images/FV_bg_*.jpg を動画に合わせて見直してください
       並びは index.html の .fv-bgp（背景画）の順と対応：0=カフェ(冒頭) 1=グレーの背景 2=暗転 3=カフェ(終盤) */
  try {
    var scPanel = $('#fv-panel'), scVideo = $('#fv-video'), scPlates = $$('#fv-bg .fv-bgp');
    if (scPanel && scVideo && scPlates.length) {
      var FV_SCENES = [
        { from: 0,    to: 3.3,  tone: 'light' },
        { from: 3.3,  to: 21.7, tone: 'dark'  },
        { from: 21.7, to: 24.2, tone: 'dark'  },
        { from: 24.2, to: 1e9,  tone: 'light' }
      ];
      var scCur = -1;
      var scApply = function(){
        var t = scVideo.currentTime || 0, idx = 0;
        for (var i = 0; i < FV_SCENES.length; i++) {
          if (t >= FV_SCENES[i].from && t < FV_SCENES[i].to) { idx = i; break; }
        }
        if (idx === scCur) { return; }
        scCur = idx;
        scPlates.forEach(function(p, i){ p.classList.toggle('is-on', i === idx); });
        scPanel.setAttribute('data-tone', FV_SCENES[idx].tone);
      };
      ['timeupdate', 'seeked', 'loadeddata', 'play'].forEach(function(ev){ scVideo.addEventListener(ev, scApply); });
      scApply();
    }
  } catch (e) { console.error(e); }

  /* ----- 5d. TRY WRISTIA 背景動画：画面に来たら自動再生（音なし・ループ）／画面外では停止 ----- */
  try {
    var tryCard = $('.final-card'), tryVideo = $('#final-video'), tryToggle = $('#final-toggle');
    if (tryCard && tryVideo && tryToggle) {
      var trySave = !!(navigator.connection && navigator.connection.saveData);
      var tryUserPaused = reduceMotion || trySave, tryInView = false, trySent = false;
      tryVideo.muted = true;            // 音はOFF（自動再生の条件でもある）
      tryVideo.volume = 0;
      var trySetPaused = function(p){
        tryCard.classList.toggle('is-paused', p);
        tryToggle.setAttribute('aria-pressed', p ? 'true' : 'false');
        tryToggle.setAttribute('aria-label', p ? '背景映像を再生' : '背景映像を一時停止');
      };
      var tryPlay = function(){
        var pr = tryVideo.play();
        if (pr && pr.catch) { pr.catch(function(){ trySetPaused(true); }); }
      };
      tryVideo.addEventListener('playing', function(){
        trySetPaused(false);
        if (!trySent) { trySent = true; track('try_video_play'); }
      });
      if (tryUserPaused) { trySetPaused(true); }   // 動きを減らす設定／通信量節約時は、ポスター表示のまま（ボタンで再生）
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            tryInView = en.isIntersecting;
            if (tryInView && !tryUserPaused) { tryPlay(); }
            else if (!tryInView) { tryVideo.pause(); }
          });
        }, { threshold: 0.35 }).observe(tryCard);
      }
      tryToggle.addEventListener('click', function(){
        if (tryVideo.paused) { tryUserPaused = false; tryPlay(); trySetPaused(false); }
        else { tryUserPaused = true; tryVideo.pause(); trySetPaused(true); }
      });
    }
  } catch (e) { console.error(e); }

  /* ----- 6. メールフォーム ----- */
  try {
    var form = $('#mail-form');
    if (form) {
      var email = $('#email'), agree = $('#agree'), err = $('#mail-error'), done = $('#reg-done');
      var hp = form.querySelector('input[name="company"]');
      var showDone = function(){
        form.hidden = true;
        done.hidden = false;
        track('mail_complete');
      };
      var showErr = function(msg, field){
        err.textContent = msg;
        if (field === email) { email.setAttribute('aria-invalid', 'true'); }
        if (field) { field.focus(); }
      };
      email.addEventListener('input', function(){ email.removeAttribute('aria-invalid'); });
      form.addEventListener('submit', function(ev){
        ev.preventDefault();
        track('mail_submit');
        err.textContent = '';
        email.removeAttribute('aria-invalid');
        if (hp && hp.value) { form.hidden = true; done.hidden = false; return; }
        var v = (email.value || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { showErr('メールアドレスを正しく入力してください', email); return; }
        if (!agree.checked) { showErr('同意にチェックを入れてください', agree); return; }
        if (!LINKS.gas) {
          console.warn('LINKS.gas is empty');
          showDone();
          return;
        }
        var btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        fetch(LINKS.gas, { method: 'POST', body: new URLSearchParams({ email: v, page: location.href }) })
          .then(function(res){
            if (res && res.ok === false && res.type !== 'opaque') { throw new Error('bad status'); }
            showDone();
          })
          .catch(function(){
            btn.disabled = false;
            showErr('送信できませんでした。時間をおいてお試しください。', null);
          });
      });
    }
  } catch (e) { console.error(e); }
})();
