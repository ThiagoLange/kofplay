/* KofPlay UI — vanilla JS, sem dependências (CSP bloqueia CDNs). */
(function () {
    "use strict";

    var $ = function (id) { return document.getElementById(id); };

    var lessons = [];
    var current = null;
    var lang = "kof";
    var roomId = "";
    var roomSnapshot = null;
    var pushTimer = null;

    function displayName() {
        var v = "";
        try { v = ($("userInput").value || "").trim(); } catch (e) {}
        return v;
    }
    var codeArea = $("codeArea");
    var gutter = $("gutter");
    var outputBox = $("outputBox");
    var statusBadge = $("statusBadge");

    var store = {
        xp: function () { return parseInt(localStorage.getItem("kofplay_xp") || "0", 10) || 0; },
        done: function () {
            try { return JSON.parse(localStorage.getItem("kofplay_done") || "[]"); }
            catch (e) { return []; }
        },
        addXp: function (v, id) {
            var done = this.done();
            if (done.indexOf(id) !== -1) { return false; }
            done.push(id);
            try {
                localStorage.setItem("kofplay_done", JSON.stringify(done));
                localStorage.setItem("kofplay_xp", String(this.xp() + v));
            } catch (e) {}
            return true;
        },
        reset: function () {
            try {
                localStorage.removeItem("kofplay_done");
                localStorage.removeItem("kofplay_xp");
            } catch (e) {}
        }
    };

    function setBadge(text, kind) {
        statusBadge.textContent = text;
        statusBadge.className = "badge badge-" + kind;
    }

    function apiHeaders() {
        var h = { "Content-Type": "application/json" };
        var key = $("apiKeyInput").value.trim();
        if (key) { h["x-api-key"] = key; }
        return h;
    }

    function tagClass(d) {
        return d === "Fácil" ? "tag-facil" : (d === "Médio" ? "tag-medio" : "tag-dificil");
    }

    function refreshXp() {
        var total = 0, i;
        for (i = 0; i < lessons.length; i++) { total += lessons[i].xp; }
        if (!total) { total = 1; }
        var done = store.done();
        $("xpLabel").textContent = store.xp() + " XP";
        $("xpBar").style.width = Math.min(100, store.xp() / total * 100) + "%";
        $("doneLabel").textContent = done.length + " de " + lessons.length + " lições";
        renderLessonList();
    }

    function renderLessonList() {
        var box = $("lessonList");
        var done = store.done();
        box.innerHTML = "";
        lessons.forEach(function (l) {
            var isDone = done.indexOf(l.id) !== -1;
            var b = document.createElement("button");
            b.className = "lesson-btn" + ((current && current.id === l.id) ? " active" : "");
            var top = document.createElement("div");
            top.className = "lesson-top";
            var t = document.createElement("span");
            t.className = "lesson-title" + (isDone ? " done" : "");
            t.textContent = (isDone ? "✅ " : "") + l.title;
            var tag = document.createElement("span");
            tag.className = "lesson-tag " + tagClass(l.difficulty);
            tag.textContent = l.difficulty + " · " + l.xp + "xp";
            top.appendChild(t);
            top.appendChild(tag);
            b.appendChild(top);
            b.addEventListener("click", function () { selectLesson(l.id); });
            box.appendChild(b);
        });
    }

    function selectLesson(id) {
        for (var i = 0; i < lessons.length; i++) {
            if (lessons[i].id === id) { current = lessons[i]; }
        }
        if (!current) { return; }
        var box = $("lessonBox");
        box.innerHTML = "";
        var head = document.createElement("div");
        head.className = "lesson-head";
        var h = document.createElement("h2");
        h.textContent = current.title;
        var tag = document.createElement("span");
        tag.className = "lesson-tag " + tagClass(current.difficulty);
        tag.textContent = current.difficulty + " · " + current.xp + "xp";
        head.appendChild(h);
        head.appendChild(tag);
        var p = document.createElement("p");
        p.className = "lesson-desc";
        p.textContent = current.description;
        box.appendChild(head);
        box.appendChild(p);
        codeArea.value = langStarter();
        $("hintBox").classList.add("hidden");
        $("solutionBox").classList.add("hidden");
        $("verdictBox").classList.add("hidden");
        outputBox.textContent = "Aguardando execução…";
        outputBox.classList.remove("is-error");
        setBadge("idle", "muted");
        refreshGutter();
        renderLessonList();
    }

    function langStarter() { return lang === "portukof" ? (current.starterPtkf || current.starter) : current.starter; }
    function langSolution() { return lang === "portukof" ? (current.solutionPtkf || current.solution) : current.solution; }
    function langHint() { return lang === "portukof" ? (current.hintPtkf || current.hint) : current.hint; }

    function setLang(next) {
        lang = (next === "portukof") ? "portukof" : "kof";
        $("langKofBtn").classList.toggle("active", lang === "kof");
        $("langPtkfBtn").classList.toggle("active", lang === "portukof");
        if (!current) { return; }
        codeArea.value = langStarter();
        $("hintBox").classList.add("hidden");
        $("solutionBox").classList.add("hidden");
        refreshGutter();
    }

    function refreshGutter() {
        var n = codeArea.value.split("\n").length;
        var s = "";
        for (var i = 1; i <= n; i++) { s += i + "\n"; }
        gutter.textContent = s;
        gutter.scrollTop = codeArea.scrollTop;
    }

    function post(path, body) {
        return fetch(path, {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify(body)
        }).then(function (r) { return r.json(); });
    }

    function runCode() {
        outputBox.textContent = "Executando no KofPlay…";
        outputBox.classList.remove("is-error");
        setBadge("running…", "warn");
        $("runBtn").disabled = true;
        post("/api/run", { code: codeArea.value, language: lang, user: displayName() }).then(function (d) {
            if (d.exitCode === 0) {
                outputBox.textContent = d.stdout || "(sem saída)";
                setBadge("SUCCESS", "ok");
            } else {
                outputBox.textContent = "[" + (d.errorKind || "ERRO") + "] exit " + d.exitCode + "\n" +
                    (d.stderr || d.stdout || "(sem detalhes)");
                outputBox.classList.add("is-error");
                setBadge("FAILED", "err");
            }
        }).catch(function (e) {
            outputBox.textContent = "Erro de conexão: " + e;
            outputBox.classList.add("is-error");
            setBadge("OFFLINE", "err");
        }).then(function () { $("runBtn").disabled = false; });
    }

    function submitCode() {
        if (!current) { return; }
        outputBox.textContent = "Corrigindo…";
        outputBox.classList.remove("is-error");
        setBadge("running…", "warn");
        $("submitBtn").disabled = true;
        var v = $("verdictBox");
        v.classList.add("hidden");
        post("/api/submit", { lessonId: current.id, code: codeArea.value, language: lang, user: displayName() }).then(function (d) {
            v.classList.remove("hidden");
            if (d.passed) {
                var first = store.addXp(d.xpAwarded, current.id);
                refreshXp();
                v.innerHTML = "";
                var ok = document.createElement("span");
                ok.className = "verdict-ok";
                ok.textContent = "🎉 Correto! +" + d.xpAwarded + " XP" + (first ? "" : " (já contabilizado)");
                v.appendChild(ok);
                setBadge("SUCCESS", "ok");
                outputBox.textContent = d.got || "(sem saída)";
            } else if (d.error) {
                v.innerHTML = "";
                var er = document.createElement("span");
                er.className = "verdict-bad";
                er.textContent = "Erro: " + d.error;
                v.appendChild(er);
                setBadge("FAILED", "err");
                outputBox.textContent = "";
            } else {
                v.innerHTML = "";
                var bad = document.createElement("span");
                bad.className = "verdict-bad";
                bad.textContent = "❌ Ainda não. Compare esperado × obtido abaixo.";
                v.appendChild(bad);
                setBadge("FAILED", "err");
                var extra = (d.run && d.run.stderr) ? "\n--- stderr ---\n" + d.run.stderr : "";
                outputBox.textContent = "--- esperado ---\n" + d.expected + "\n--- obtido ---\n" + (d.got || "(vazio)") + extra;
                outputBox.classList.add("is-error");
            }
        }).catch(function (e) {
            outputBox.textContent = "Erro de conexão: " + e;
            outputBox.classList.add("is-error");
            setBadge("OFFLINE", "err");
        }).then(function () { $("submitBtn").disabled = false; });
    }

    $("runBtn").addEventListener("click", runCode);
    $("submitBtn").addEventListener("click", submitCode);
    $("hintBtn").addEventListener("click", function () {
        if (!current) { return; }
        var box = $("hintBox");
        box.textContent = langHint();
        box.classList.toggle("hidden");
    });
    $("solutionBtn").addEventListener("click", function () {
        if (!current) { return; }
        var box = $("solutionBox");
        box.textContent = langSolution();
        box.classList.toggle("hidden");
    });
    $("langKofBtn").addEventListener("click", function () { setLang("kof"); });
    $("langPtkfBtn").addEventListener("click", function () { setLang("portukof"); });
    setLang("kof");

    function refreshRanking() {
        fetch("/api/ranking", { headers: apiHeaders() }).then(function (r) { return r.json(); }).then(function (d) {
            var box = $("rankList");
            box.innerHTML = "";
            (d.users || []).slice(0, 5).forEach(function (u) {
                var row = document.createElement("div");
                row.className = "rank-row";
                var a = document.createElement("span");
                a.textContent = u.user;
                var b = document.createElement("span");
                b.className = "mono";
                b.textContent = u.xp + " XP · " + (u.lessons || []).length;
                row.appendChild(a);
                row.appendChild(b);
                box.appendChild(row);
            });
            (d.feed || []).slice(-4).reverse().forEach(function (f) {
                var row = document.createElement("div");
                row.className = "rank-feed";
                row.textContent = f.user + (f.passed ? " ✅ " : " ❌ ") + f.lesson + " (+" + f.xp + ")";
                box.appendChild(row);
            });
        }).catch(function () {});
    }

    function roomPoll() {
        if (!roomId) { return; }
        post("/api/room/presence", { room: roomId, user: displayName() }).then(function (d) {
            if (d.error) { return; }
            var names = (d.users || []).map(function (u) { return u.user; });
            var label = roomId + (names.length ? ": " + names.join(", ") : " (nova sala — criada!)");
            $("presenceLine").textContent = label;
            var holder = d.holder || "";
            var me = displayName();
            var hl = $("holderLine");
            var holdBtn = $("holdBtn");
            var relBtn = $("releaseBtn");
            if (!holder) {
                hl.textContent = "sem piloto — quem enviar código assume";
                holdBtn.classList.remove("hidden");
                relBtn.classList.add("hidden");
                codeArea.readOnly = false;
            } else if (holder === me) {
                hl.textContent = "✈️ você está pilotando";
                holdBtn.classList.add("hidden");
                relBtn.classList.remove("hidden");
                codeArea.readOnly = false;
            } else {
                hl.textContent = "✈️ " + holder + " pilotando";
                holdBtn.classList.remove("hidden");
                relBtn.classList.add("hidden");
                codeArea.readOnly = true;
            }
            if (typeof d.code === "string" && d.updatedBy && d.updatedBy !== displayName()
                    && d.code !== roomSnapshot && codeArea.value === roomSnapshot) {
                var s = codeArea.selectionStart, e = codeArea.selectionEnd;
                codeArea.value = d.code;
                roomSnapshot = d.code;
                try {
                    codeArea.selectionStart = Math.min(s, d.code.length);
                    codeArea.selectionEnd = Math.min(e, d.code.length);
                } catch (ex) {}
                refreshGutter();
            }
            var syncBtn = $("roomSyncBtn");
            if (typeof d.code === "string" && d.updatedBy && d.updatedBy !== displayName()
                    && d.code !== codeArea.value) {
                syncBtn.classList.remove("hidden");
            } else {
                syncBtn.classList.add("hidden");
            }
        }).catch(function () {});
    }

    function roomPush() {
        if (!roomId) { return; }
        post("/api/room/push", { room: roomId, user: displayName(), code: codeArea.value }).then(function (d) {
            if (!d.error) { roomSnapshot = codeArea.value; } else { roomPoll(); }
        }).catch(function () {});
    }

    function schedulePush() {
        if (pushTimer) { clearTimeout(pushTimer); }
        pushTimer = setTimeout(function () {
            if (roomId && codeArea.value !== roomSnapshot) { roomPush(); }
        }, 400);
    }

    $("roomJoinBtn").addEventListener("click", function () {
        var v = ($("roomInput").value || "").trim().toLowerCase();
        roomId = v;
        roomSnapshot = null;
        codeArea.readOnly = false;
        if (roomId) { roomPoll(); }
    });
    $("holdBtn").addEventListener("click", function () {
        if (!roomId) { return; }
        post("/api/room/hold", { room: roomId, user: displayName() }).then(function () { roomPoll(); }).catch(function () {});
    });
    $("releaseBtn").addEventListener("click", function () {
        if (!roomId) { return; }
        post("/api/room/release", { room: roomId, user: displayName() }).then(function () { roomPoll(); }).catch(function () {});
    });
    $("roomSyncBtn").addEventListener("click", function () {
        if (!roomId) { return; }
        post("/api/room/state", { room: roomId }).then(function (d) {
            if (typeof d.code === "string") {
                codeArea.value = d.code;
                roomSnapshot = d.code;
                refreshGutter();
                $("roomSyncBtn").classList.add("hidden");
            }
        }).catch(function () {});
    });
    codeArea.addEventListener("input", function () { schedulePush(); });
    try { $("userInput").value = localStorage.getItem("kofplay_user") || ""; } catch (e) {}
    $("userInput").addEventListener("change", function () {
        try { localStorage.setItem("kofplay_user", $("userInput").value); } catch (e) {}
    });
    try { $("roomInput").value = localStorage.getItem("kofplay_room") || ""; } catch (e) {}
    $("roomInput").addEventListener("change", function () {
        try { localStorage.setItem("kofplay_room", $("roomInput").value); } catch (e) {}
    });
    setInterval(refreshRanking, 10000);
    setInterval(roomPoll, 1500);
    refreshRanking();
    $("apiKeyInput").addEventListener("change", function () {
        try { localStorage.setItem("kofplay_api_key", $("apiKeyInput").value); } catch (e) {}
    });
    $("resetBtn").addEventListener("click", function () {
        if (!confirm("Zerar XP e lições concluídas e recomeçar do zero?")) { return; }
        store.reset();
        refreshXp();
    });
    try { $("apiKeyInput").value = localStorage.getItem("kofplay_api_key") || ""; } catch (e) {}

    codeArea.addEventListener("keydown", function (e) {
        if (e.key === "Tab") {
            e.preventDefault();
            var s = codeArea.selectionStart;
            codeArea.value = codeArea.value.slice(0, s) + "    " + codeArea.value.slice(codeArea.selectionEnd);
            codeArea.selectionStart = codeArea.selectionEnd = s + 4;
            refreshGutter();
        }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { runCode(); }
    });
    codeArea.addEventListener("input", refreshGutter);
    codeArea.addEventListener("scroll", function () { gutter.scrollTop = codeArea.scrollTop; });

    fetch("/api/health").then(function (r) { return r.json(); }).then(function (h) {
        var hb = $("healthBadge");
        hb.textContent = "health: " + (h.status || "UP");
        hb.className = "badge " + ((h.status === "UP") ? "badge-ok" : "badge-err");
        $("kofVer").textContent = (h.kof_version || "").trim();
    }).catch(function () {
        var hb = $("healthBadge");
        hb.textContent = "health: OFFLINE";
        hb.className = "badge badge-err";
    });

    fetch("/api/lessons").then(function (r) { return r.json(); }).then(function (data) {
        lessons = (data instanceof Array) ? data : [];
        refreshXp();
        if (lessons.length) { selectLesson(lessons[0].id); }
    }).catch(function (e) {
        $("lessonBox").innerHTML = "";
        var p = document.createElement("p");
        p.className = "muted";
        p.textContent = "Falha ao carregar lições: " + e;
        $("lessonBox").appendChild(p);
    });
})();
