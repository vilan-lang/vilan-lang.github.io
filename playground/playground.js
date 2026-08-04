function __at(list, index) {
	if (index >= 0 && index < list.length) return list[index];
	throw "index out of bounds: the length is " + list.length + " but the index is " + index;
}
function __at_put(list, index, value) {
	if (index >= 0 && index < list.length) return list[index] = value;
	throw "index out of bounds: the length is " + list.length + " but the index is " + index;
}
function __clone(value) {
	if (Array.isArray(value)) return value.map(__clone);
	if (value instanceof Set) return new Set([ ...value ].map(__clone));
	if (value instanceof Map) return new Map([ ...value ].map(([ k, v ]) => [ __clone(k), __clone(v) ]));
	return value;
}
function __hash(value) {
	return (typeof value === "object" && value !== null) ? JSON.stringify(value) : value;
}
function __hmr_active() {
	return typeof globalThis.__VILAN_HMR__ !== "undefined";
}
function __list_get(list, index) {
	return index >= 0 && index < list.length ? [ 0, __clone(list[index]) ] : [ 1 ];
}
function __list_pop(list) {
	return list.length === 0 ? [ 1 ] : [ 0, list.pop() ];
}
function __map_get(map, key) {
	return map.has(key) ? [ 0, __clone(map.get(key)) ] : [ 1 ];
}
function __map_values(map) {
	return [ ...map.values() ].map(__clone);
}
function __shared_new(value) {
	return { v: value };
}
class __Task {
	constructor(run, origin, nursery) {
		this.origin = origin;
		this.observed = false;
		this.nursery = nursery;
		this.owned = !!nursery;
		this.rejected = false;
		this.error = undefined;
		this.promise = run();
		this.promise.then(null, (error) => {
			this.rejected = true;
			this.error = error;
			if (this.owned && !__nursery_is_cancel(error)) this.nursery.__fail(this);
			if (!this.observed && !this.owned) {
				globalThis.setTimeout(() => {
					if (!this.observed) console.error("unhandled task error (spawned in " + this.origin + "): " + String(error));
				}, 0);
			}
		});
		if (nursery) nursery.children.push(this);
	}
	then(onFulfilled, onRejected) {
		this.observed = true;
		return this.promise.then(onFulfilled, onRejected);
	}
}
function __task(run, origin, nursery) {
	return new __Task(run, origin, nursery);
}
class __Timer {
	constructor(ms) {
		this.settled = false;
		this.verdict = false;
		this.waiters = [];
		this.id = setTimeout(() => this.__settle(true), ms);
	}
	__settle(verdict) {
		if (this.settled) return;
		this.settled = true;
		this.verdict = verdict;
		const waiters = this.waiters;
		this.waiters = [];
		for (const wake of waiters) wake(verdict);
	}
	cancel() {
		if (this.settled) return;
		clearTimeout(this.id);
		this.__settle(false);
	}
	wait(signal) {
		if (this.settled) return Promise.resolve(this.verdict);
		const sig = signal && signal[0] === 0 ? signal[1] : undefined;
		return new Promise((resolve, reject) => {
			if (sig && sig.aborted) {
				reject(sig.reason);
				return;
			}
			this.waiters.push(resolve);
			if (sig) sig.addEventListener("abort", () => {
				const parked = this.waiters.indexOf(resolve);
				if (parked >= 0) this.waiters.splice(parked, 1);
				reject(sig.reason);
			}, { once: true });
		});
	}
}
function __timer(ms) {
	return new __Timer(ms);
}
function hash(self) {
	return __hash(self);
}
function fresh_id() {
	const id = next_subscriber_id.v;
	next_subscriber_id.v = id + 1;
	return id;
}
function new2() {
	return [ __shared_new([  ]), __shared_new(false), __shared_new(false), __shared_new(false) ];
}
function enqueue(turn, subscribers) {
	for (const subscriber of subscribers) {
		let seen = false;
		for (const queued of turn[0].v) {
			if (queued[0] === subscriber[0]) {
				seen = true;
			}
		}
		if (!(seen)) {
			turn[0].v.push(__clone(subscriber));
		}
	}
	if (turn[2].v && !(turn[3].v) && !(turn[1].v)) {
		turn[3].v = true;
		queueMicrotask(() => {
			turn[3].v = false;
			drain(turn);
			return;
		});
	}
}
function drain(turn) {
	if (!(turn[1].v)) {
		turn[1].v = true;
		draining_turns.v.push(__clone(turn));
		let budget = 100000;
		while (!($k(turn[0].v)) && budget > 0) {
			const wave = turn[0].v;
			turn[0].v = [  ];
			for (const subscriber of wave) {
				subscriber[1]();
				budget = budget - 1;
			}
		}
		__list_pop(draining_turns.v);
		turn[1].v = false;
	}
}
function dispose(self, $ap) {
	let kept = [  ];
	for (const subscriber of self[0].v) {
		if (subscriber[0] !== self[1]) {
			kept.push(__clone(subscriber));
		}
	}
	self[0].v = kept;
	const $aq = $ap;
	let $ar = null;
	if ($aq[0] === 0) {
		const turn = $aq[1];
		let kept_pending = [  ];
		for (const subscriber2 of turn[0].v) {
			if (subscriber2[0] !== self[1]) {
				kept_pending.push(__clone(subscriber2));
			}
		}
		turn[0].v = kept_pending;
		$ar = undefined;
	} else {
		$ar = undefined;
	}
	return $ar;
}
function new3() {
	return [ __shared_new([  ]) ];
}
function defer(self, cleanup) {
	self[0].v.push(cleanup);
}
function dispose2(self) {
	for (const cleanup of self[0].v) {
		cleanup();
	}
	self[0].v = [  ];
}
function get_owner($ak) {
	return $ak;
}
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $E) {
	return await (self[0].wait(ambient_signal($E)));
}
function cancel(self) {
	self[0].cancel();
}
function ambient_signal($F) {
	const $G = $F;
	let $H = null;
	if ($G[0] === 0) {
		const n = $G[1];
		$H = [ 0, n.signal_of() ];
	} else {
		$H = [ 1 ];
	}
	return $H;
}
function view(tag) {
	let $T = null;
	if (is_svg_tag(tag)) {
		$T = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$T = [ document.createElement(tag) ];
	}
	return $T;
}
function is_svg_tag(tag) {
	const $R = tag;
	let $S = null;
	if ($R === "svg") {
		$S = true;
	} else if ($R === "path") {
		$S = true;
	} else if ($R === "circle") {
		$S = true;
	} else if ($R === "ellipse") {
		$S = true;
	} else if ($R === "rect") {
		$S = true;
	} else if ($R === "line") {
		$S = true;
	} else if ($R === "polyline") {
		$S = true;
	} else if ($R === "polygon") {
		$S = true;
	} else if ($R === "g") {
		$S = true;
	} else if ($R === "defs") {
		$S = true;
	} else if ($R === "use") {
		$S = true;
	} else if ($R === "symbol") {
		$S = true;
	} else if ($R === "marker") {
		$S = true;
	} else if ($R === "pattern") {
		$S = true;
	} else if ($R === "mask") {
		$S = true;
	} else if ($R === "clipPath") {
		$S = true;
	} else if ($R === "linearGradient") {
		$S = true;
	} else if ($R === "radialGradient") {
		$S = true;
	} else if ($R === "stop") {
		$S = true;
	} else if ($R === "text") {
		$S = true;
	} else if ($R === "tspan") {
		$S = true;
	} else if ($R === "textPath") {
		$S = true;
	} else if ($R === "filter") {
		$S = true;
	} else if ($R === "foreignObject") {
		$S = true;
	} else if ($R === "feGaussianBlur") {
		$S = true;
	} else if ($R === "feColorMatrix") {
		$S = true;
	} else if ($R === "feOffset") {
		$S = true;
	} else if ($R === "feMerge") {
		$S = true;
	} else if ($R === "feMergeNode") {
		$S = true;
	} else if ($R === "feFlood") {
		$S = true;
	} else if ($R === "feComposite") {
		$S = true;
	} else if ($R === "feBlend") {
		$S = true;
	} else if ($R === "feDropShadow") {
		$S = true;
	} else {
		$S = false;
	}
	return $S;
}
function text(self, content) {
	self[0].textContent = content;
	return __clone(self);
}
function styled(self, style) {
	self[0].setAttribute("class", class_list(style));
	return __clone(self);
}
function style_var(self, name, source, $af, $ag) {
	const element = __clone(self[0]);
	$ah(source, (value) => {
		element.style.setProperty(name, value);
		return;
	}, $af, $ag);
	return __clone(self);
}
function on(self, event, handler) {
	self[0].addEventListener(event, () => {
		return $aH([ 1 ], ($aG) => {
			return handler($aG);
		});
	});
	return __clone(self);
}
function bind_text(self, source, $aC, $aD) {
	const element = __clone(self[0]);
	$aE(source, (value) => {
		element.textContent = value;
		return;
	}, $aC, $aD);
	return __clone(self);
}
function show(self, condition, $aI, $aJ) {
	const element = __clone(self[0]);
	$aK(condition, (visible) => {
		element.hidden = !(visible);
		return;
	}, $aI, $aJ);
	return __clone(self);
}
function place(self, parent) {
	parent[0].appendChild(self[0]);
}
function apply(self, parent, name) {
	parent[0].setAttribute(name, self);
}
function mount(id, view2) {
	const element = document.getElementById(id);
	element.replaceChildren();
	element.appendChild(view2[0]);
}
function mount_root(id, body) {
	const $bG = $bF([ 1 ], ($bD) => {
		return $bE(body);
	});
	const built = $bG[0];
	const root = $bG[1];
	mount(id, built);
	if (__hmr_active()) {
		const element = document.getElementById(id);
		on_teardown(() => {
			dispose2(root);
			element.replaceChildren();
			return;
		});
	}
	return root;
}
function on_teardown(cleanup) {
	if (__hmr_active()) {
		__hmr_register_teardown(cleanup);
	}
}
function class_list(self) {
	let out = "";
	for (const entry of $ab(self[0])) {
		const $ac = entry;
		const class2 = $ac[0];
		const _declaration = $ac[1];
		if (out === "") {
			out = class2;
		} else {
			out = out + " " + class2;
		}
	}
	return out;
}
function add(self, b) {
	let rules = __clone(self[0]);
	for (const key of $U(b[0])) {
		const $Y = $V(b[0], key);
		let $Z = null;
		if ($Y[0] === 0) {
			const entry = $Y[1];
			$Z = $aa(rules, key, entry);
		} else {
			$Z = undefined;
		}
		$Z;
	}
	return [ __clone(rules) ];
}
function template_option(value, label, $aN, $aO) {
	return text($as(view("option"), "value", value, $aN, $aO), label);
}
function severity_tag(row) {
	const $bc = row[1];
	let $bd = null;
	if ($bc === "error") {
		$bd = text(styled(view("span"), diag_error), "error");
	} else {
		$bd = text(styled(view("span"), diag_warning), "warning");
	}
	return $bd;
}
function diagnostic_row(row, $ba, $bb) {
	const head = $av($av($av(view("div"), severity_tag(row), $ba, $bb), text(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " "), $ba, $bb), text(view("span"), row[5]), $ba, $bb);
	const $be = row[6];
	let $bf = null;
	if ($be === "") {
		$bf = head;
	} else {
		$bf = $av($av(view("div"), head, $ba, $bb), text(styled(view("div"), diag_note), "  note: " + row[6]), $ba, $bb);
	}
	return $bf;
}
function console_row(row) {
	const $bw = row[1];
	let $bx = null;
	if ($bw === "error") {
		$bx = text(styled(view("div"), console_error), row[2]);
	} else {
		$bx = text(view("div"), row[2]);
	}
	return $bx;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, share_label2, mode2, run2, format2, share2, $P, $Q) {
	return $av($av(styled(view("div"), add(shell, page_fill)), top_bar($a("1"), $P, $Q), $P, $Q), $av($av($av(styled(view("main"), add(wide_column, workbench)), text(styled(view("h1"), pane_label), "Playground: vilan in the browser"), $P, $Q), $av($av($av($av($av($av(styled(view("div"), controls), on(bind_text(styled(view("button"), run_button), $aA(mode2, (current) => {
		const $ay = current;
		let $az = null;
		if ($ay === "node") {
			$az = "Check";
		} else {
			$az = "Run";
		}
		return $az;
	}, $P), $P, $Q), "click", ($aF) => {
		return run2();
	}), $P, $Q), $av($av(show($as($as(styled(view("select"), template_select), "id", "mode", $P, $Q), "aria-label", "Compile mode", $P, $Q), can_platform2, $P, $Q), template_option("browser", "Browser: compile and run", $P, $Q), $P, $Q), template_option("node", "Server: check the process leg", $P, $Q), $P, $Q), $P, $Q), show(on(text(styled(view("button"), example_button), "Format"), "click", ($aP) => {
		return format2();
	}), can_format2, $P, $Q), $P, $Q), on(bind_text(styled(view("button"), example_button), share_label2, $P, $Q), "click", ($aQ) => {
		return share2();
	}), $P, $Q), bind_text($as(styled(view("p"), status_line), "role", "status", $P, $Q), status2, $P, $Q), $P, $Q), $as($as(styled(view("select"), template_select), "id", "version", $P, $Q), "aria-label", "Compiler version", $P, $Q), $P, $Q), $P, $Q), $av($av(styled(view("div"), panes), $av($av($av($av(styled(view("div"), pane), $av($av(styled(view("div"), pane_head), text(styled(view("p"), pane_label), "Program"), $P, $Q), $av($av($av($av($av($as($as(styled(view("select"), template_select), "id", "template", $P, $Q), "aria-label", "Load an example", $P, $Q), text($as($as($as(view("option"), "value", "", $P, $Q), "disabled", "true", $P, $Q), "hidden", "true", $P, $Q), "Examples"), $P, $Q), template_option("counter", "Counter: reactive state", $P, $Q), $P, $Q), template_option("hello", "Hello: mount and print", $P, $Q), $P, $Q), template_option("styles", "Styles: compile-time CSS", $P, $Q), $P, $Q), show(template_option("server", "Server: typed HTTP, checked", $P, $Q), can_platform2, $P, $Q), $P, $Q), $P, $Q), $P, $Q), $as($as(styled(view("div"), editor_host), "id", "editor", $P, $Q), "aria-label", "Program editor", $P, $Q), $P, $Q), text(styled(view("p"), pane_label), "Diagnostics"), $P, $Q), $av($av(styled(view("pre"), report_pre), show(text(styled(view("div"), quiet_row), "Nothing to report."), $aR(diagnostics2, (rows) => {
		return rows.length === 0;
	}, $P), $P, $Q), $P, $Q), $bg(view("div"), diagnostics2, (row) => {
		return row[0];
	}, (row, $aZ) => {
		return diagnostic_row(row, $P, $aZ);
	}, $P, $Q), $P, $Q), $P, $Q), $P, $Q), $av($av($av($av(styled(view("div"), pane), text(styled(view("p"), pane_label), "Result"), $P, $Q), $as($as(styled(view("div"), runner_host), "id", "runner", $P, $Q), "aria-label", "Program result", $P, $Q), $P, $Q), text(styled(view("p"), pane_label), "Console"), $P, $Q), $av($av(styled(view("pre"), report_pre), show(text(styled(view("div"), quiet_row), "Program output lands here."), $bt(console_lines2, (rows) => {
		return rows.length === 0;
	}, $P), $P, $Q), $P, $Q), $by(view("div"), console_lines2, (row) => {
		return row[0];
	}, (row, $bv) => {
		return console_row(row);
	}, $P, $Q), $P, $Q), $P, $Q), $P, $Q), $P, $Q), $P, $Q);
}
function eq(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2] && self[3] === other[3] && self[4] === other[4] && self[5] === other[5] && self[6] === other[6];
}
function eq2(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2];
}
function top_bar(scroll_fade, $ad, $ae) {
	return $av(style_var(styled(view("nav"), topbar), "--nav-fade", scroll_fade, $ad, $ae), $av($av(styled(view("div"), add(column, nav_row)), $av($av($as(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $ad, $ae), $as($as($as(styled(view("img"), no_drag), "src", "" + assets + "/mark.svg", $ad, $ae), "alt", "", $ad, $ae), "height", "18", $ad, $ae), $ad, $ae), text(view("span"), "VILAN"), $ad, $ae), $ad, $ae), $av($av($av(styled(view("div"), nav_links), text($as(styled(view("a"), nav_link), "href", "#install", $ad, $ae), "Install"), $ad, $ae), text($as(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html", $ad, $ae), "Learn"), $ad, $ae), text($as(styled(view("a"), nav_link), "href", "/docs/", $ad, $ae), "Docs"), $ad, $ae), $ad, $ae), $ad, $ae);
}
function $a(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function $b(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function $c(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function $d(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function $k(self) {
	return self.length === 0;
}
function $l(self) {
	return __list_get(self, self.length - 1);
}
function $g(self, $h) {
	const $i = $h;
	let $j = null;
	if ($i[0] === 0) {
		const turn = $i[1];
		$j = enqueue(turn, self[1].v);
	} else {
		const $m = $l(draining_turns.v);
		let $n = null;
		if ($m[0] === 0) {
			const draining = $m[1];
			$n = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$n = undefined;
		}
		$j = $n;
	}
	return $j;
}
function $e(self, value, $f) {
	self[0].v = value;
	$g(self, $f);
}
function $r(self, $h) {
	const $s = $h;
	let $t = null;
	if ($s[0] === 0) {
		const turn = $s[1];
		$t = enqueue(turn, self[1].v);
	} else {
		const $u = $l(draining_turns.v);
		let $v = null;
		if ($u[0] === 0) {
			const draining = $u[1];
			$v = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$v = undefined;
		}
		$t = $v;
	}
	return $t;
}
function $q(self, value, $f) {
	self[0].v = value;
	$r(self, $f);
}
function $x(self, $h) {
	const $y = $h;
	let $z = null;
	if ($y[0] === 0) {
		const turn = $y[1];
		$z = enqueue(turn, self[1].v);
	} else {
		const $A = $l(draining_turns.v);
		let $B = null;
		if ($A[0] === 0) {
			const draining = $A[1];
			$B = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$B = undefined;
		}
		$z = $B;
	}
	return $z;
}
function $w(self, value, $f) {
	self[0].v = value;
	$x(self, $f);
}
function $J(self, $h) {
	const $K = $h;
	let $L = null;
	if ($K[0] === 0) {
		const turn = $K[1];
		$L = enqueue(turn, self[1].v);
	} else {
		const $M = $l(draining_turns.v);
		let $N = null;
		if ($M[0] === 0) {
			const draining = $M[1];
			$N = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$N = undefined;
		}
		$L = $N;
	}
	return $L;
}
function $I(self, value, $f) {
	self[0].v = value;
	$J(self, $f);
}
function $U(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[0]));
	}
	return result;
}
function $V(self, key) {
	const $W = __map_get(self[0], hash(key));
	let $X = null;
	if ($W[0] === 0) {
		const entry = $W[1];
		$X = [ 0, __clone(entry[1]) ];
	} else {
		$X = [ 1 ];
	}
	return $X;
}
function $aa(self, key, value) {
	self[0].set(hash(key), [ __clone(key), __clone(value) ]);
}
function $ab(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[1]));
	}
	return result;
}
function $am(self) {
	return self[0].v;
}
function $al(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($am(self));
		return;
	} ]);
	observer($am(self));
	return [ self[1], id ];
}
function $an(self, item, $ao) {
	self[0].v.push(() => {
		dispose(item, $ao);
		return;
	});
	return __clone(item);
}
function $ah(self, observer, $ai, $aj) {
	$an(get_owner($aj), $al(self, observer), $ai);
}
function $as(self, name, value, $at, $au) {
	apply(value, self, name, $at, $au);
	return __clone(self);
}
function $av(self, content, $aw, $ax) {
	place(content, self, $aw, $ax);
	return __clone(self);
}
function $aA(self, transform, $aB) {
	const derived = $a(transform($am(self)));
	self[1].v.push([ fresh_id(), () => {
		$e(derived, transform($am(self)), $aB);
		return;
	} ]);
	return derived;
}
function $aE(self, observer, $ai, $aj) {
	$an(get_owner($aj), $al(self, observer), $ai);
}
function $aH(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $aM(self) {
	return self[0].v;
}
function $aL(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($aM(self));
		return;
	} ]);
	observer($aM(self));
	return [ self[1], id ];
}
function $aK(self, observer, $ai, $aj) {
	$an(get_owner($aj), $aL(self, observer), $ai);
}
function $aS(self) {
	return self[0].v;
}
function $aU(self, $h) {
	const $aV = $h;
	let $aW = null;
	if ($aV[0] === 0) {
		const turn = $aV[1];
		$aW = enqueue(turn, self[1].v);
	} else {
		const $aX = $l(draining_turns.v);
		let $aY = null;
		if ($aX[0] === 0) {
			const draining = $aX[1];
			$aY = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$aY = undefined;
		}
		$aW = $aY;
	}
	return $aW;
}
function $aT(self, value, $f) {
	self[0].v = value;
	$aU(self, $f);
}
function $aR(self, transform, $aB) {
	const derived = $d(transform($aS(self)));
	self[1].v.push([ fresh_id(), () => {
		$aT(derived, transform($aS(self)), $aB);
		return;
	} ]);
	return derived;
}
function $bj(old_keys, old_items, items, key_of) {
	let claimed = [  ];
	for (const _ of old_keys) {
		claimed.push(false);
	}
	let steps = [  ];
	for (const item of items) {
		const item_key = key_of(item);
		let step = [ 2 ];
		let index = 0;
		while (index < old_keys.length) {
			if (!(__at(claimed, index)) && __at(old_keys, index) === item_key) {
				__at_put(claimed, index, true);
				let $bk = null;
				if (eq(__at(old_items, index), item)) {
					$bk = [ 0, index ];
				} else {
					$bk = [ 1, index ];
				}
				step = $bk;
				break;
			}
			index = index + 1;
		}
		steps.push(step);
	}
	let removed = [  ];
	let index2 = 0;
	while (index2 < old_keys.length) {
		if (!(__at(claimed, index2))) {
			removed.push(index2);
		}
		index2 = index2 + 1;
	}
	return [ __clone(steps), __clone(removed) ];
}
function $bo(owner, body) {
	return body(owner);
}
function $bs(self) {
	return self[0].v;
}
function $br(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($bs(self));
		return;
	} ]);
	observer($bs(self));
	return [ self[1], id ];
}
function $bq(self, observer, $ai, $aj) {
	$an(get_owner($aj), $br(self, observer), $ai);
}
function $bg(self, source, key, render, $bh, $bi) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($bi), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$bq(source, (list) => {
		const plan = $bj(row_keys.v, row_items.v, list, key);
		const previous_views = row_views.v;
		const previous_owners = row_owners.v;
		for (const index of plan[1]) {
			dispose2(__at(previous_owners, index));
			__at(previous_views, index)[0].remove();
		}
		let next_views = [  ];
		let next_owners = [  ];
		let position = 0;
		for (const step of plan[0]) {
			const item = __clone(__at(list, position));
			const $bl = step;
			let $bm = null;
			if ($bl[0] === 0) {
				const index2 = $bl[1];
				next_views.push(__clone(__at(previous_views, index2)));
				next_owners.push(__clone(__at(previous_owners, index2)));
				$bm = undefined;
			} else if ($bl[0] === 1) {
				const index3 = $bl[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bo(owner, ($bn) => {
					return render(item, $bn);
				}));
				next_owners.push(__clone(owner));
				$bm = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bo(owner2, ($bp) => {
					return render(item, $bp);
				}));
				next_owners.push(__clone(owner2));
				$bm = undefined;
			}
			$bm;
			position = position + 1;
		}
		for (const row of next_views) {
			element.appendChild(row[0]);
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		row_keys.v = next_keys;
		row_items.v = list;
		row_views.v = next_views;
		row_owners.v = next_owners;
		return;
	}, $bh, $bi);
	return __clone(self);
}
function $bu(self) {
	return self[0].v;
}
function $bt(self, transform, $aB) {
	const derived = $d(transform($bu(self)));
	self[1].v.push([ fresh_id(), () => {
		$aT(derived, transform($bu(self)), $aB);
		return;
	} ]);
	return derived;
}
function $bz(old_keys, old_items, items, key_of) {
	let claimed = [  ];
	for (const _ of old_keys) {
		claimed.push(false);
	}
	let steps = [  ];
	for (const item of items) {
		const item_key = key_of(item);
		let step = [ 2 ];
		let index = 0;
		while (index < old_keys.length) {
			if (!(__at(claimed, index)) && __at(old_keys, index) === item_key) {
				__at_put(claimed, index, true);
				let $bA = null;
				if (eq2(__at(old_items, index), item)) {
					$bA = [ 0, index ];
				} else {
					$bA = [ 1, index ];
				}
				step = $bA;
				break;
			}
			index = index + 1;
		}
		steps.push(step);
	}
	let removed = [  ];
	let index2 = 0;
	while (index2 < old_keys.length) {
		if (!(__at(claimed, index2))) {
			removed.push(index2);
		}
		index2 = index2 + 1;
	}
	return [ __clone(steps), __clone(removed) ];
}
function $by(self, source, key, render, $bh, $bi) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($bi), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$bq(source, (list) => {
		const plan = $bz(row_keys.v, row_items.v, list, key);
		const previous_views = row_views.v;
		const previous_owners = row_owners.v;
		for (const index of plan[1]) {
			dispose2(__at(previous_owners, index));
			__at(previous_views, index)[0].remove();
		}
		let next_views = [  ];
		let next_owners = [  ];
		let position = 0;
		for (const step of plan[0]) {
			const item = __clone(__at(list, position));
			const $bB = step;
			let $bC = null;
			if ($bB[0] === 0) {
				const index2 = $bB[1];
				next_views.push(__clone(__at(previous_views, index2)));
				next_owners.push(__clone(__at(previous_owners, index2)));
				$bC = undefined;
			} else if ($bB[0] === 1) {
				const index3 = $bB[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bo(owner, ($bn) => {
					return render(item, $bn);
				}));
				next_owners.push(__clone(owner));
				$bC = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bo(owner2, ($bp) => {
					return render(item, $bp);
				}));
				next_owners.push(__clone(owner2));
				$bC = undefined;
			}
			$bC;
			position = position + 1;
		}
		for (const row of next_views) {
			element.appendChild(row[0]);
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		row_keys.v = next_keys;
		row_items.v = list;
		row_views.v = next_views;
		row_owners.v = next_owners;
		return;
	}, $bh, $bi);
	return __clone(self);
}
function $bE(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, __clone(scope) ];
}
function $bF(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $bL(self, $h) {
	const $bM = $h;
	let $bN = null;
	if ($bM[0] === 0) {
		const turn = $bM[1];
		$bN = enqueue(turn, self[1].v);
	} else {
		const $bO = $l(draining_turns.v);
		let $bP = null;
		if ($bO[0] === 0) {
			const draining = $bO[1];
			$bP = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bP = undefined;
		}
		$bN = $bP;
	}
	return $bN;
}
function $bK(self, value, $f) {
	self[0].v = value;
	$bL(self, $f);
}
function $bS(self) {
	return self[0].v;
}
function $bU(self, $h) {
	const $bV = $h;
	let $bW = null;
	if ($bV[0] === 0) {
		const turn = $bV[1];
		$bW = enqueue(turn, self[1].v);
	} else {
		const $bX = $l(draining_turns.v);
		let $bY = null;
		if ($bX[0] === 0) {
			const draining = $bX[1];
			$bY = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bY = undefined;
		}
		$bW = $bY;
	}
	return $bW;
}
function $bT(self, value, $f) {
	self[0].v = value;
	$bU(self, $f);
}
function $bQ(self, transform, $bR) {
	$bT(self, transform($bS(self)), $bR);
}
const next_subscriber_id = __shared_new(0);
const draining_turns = __shared_new([  ]);
const wide_column = [ [ new Map([ [ "::max-width", [ "::max-width", [ "s1eewcz2", "max-width:1880px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vtg8d6", "padding-left:32px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t4hls", "padding-right:32px" ] ] ] ]) ] ];
const page_fill = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::min-height", [ "::min-height", [ "sw3dlhu", "min-height:100vh" ] ] ] ]) ] ];
const workbench = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxs0", "padding-top:var(--space-6)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyn8", "padding-bottom:var(--space-6)" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::width", [ "::width", [ "s178flj9", "width:100%" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ] ]) ] ];
const panes = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "1024px::flex-direction", [ "1024px::flex-direction", [ "s1a4afps", "flex-direction:row" ] ] ] ]) ] ];
const pane = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ], [ "::flex", [ "::flex", [ "s4sfhb", "flex:1 1 0" ] ] ] ]) ] ];
const pane_label = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4et", "opacity:0.6" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odj214", "letter-spacing:0.14em" ] ] ], [ "::text-transform", [ "::text-transform", [ "s1s2tj83", "text-transform:uppercase" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const editor_host = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9sl", "border-radius:var(--space-3)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sw4tyxs", "min-height:320px" ] ] ] ]) ] ];
const runner_host = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9sl", "border-radius:var(--space-3)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sw4tyxs", "min-height:320px" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ] ]) ] ];
const controls = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ] ]) ] ];
const run_button = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1qm4s0m", "background-color:#EB682E" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9ro", "border-radius:var(--space-2)" ] ] ], [ "::padding", [ "::padding", [ "s1d0a46f", "padding:8px 20px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::font-size", [ "::font-size", [ "sayk3oa", "font-size:14px" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "szyotuk", "opacity:0.9" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const example_button = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9ro", "border-radius:var(--space-2)" ] ] ], [ "::padding", [ "::padding", [ "s1ihgui1", "padding:7px 14px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "srapg3a", "opacity:1" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const status_line = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4eu", "opacity:0.7" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ] ]) ] ];
const pane_head = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ] ]) ] ];
const template_select = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9ro", "border-radius:var(--space-2)" ] ] ], [ "::padding", [ "::padding", [ "s1nyo5tw", "padding:6px 10px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "srapg3a", "opacity:1" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const report_pre = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9sl", "border-radius:var(--space-3)" ] ] ], [ "::padding", [ "::padding", [ "s1ufvr2", "padding:var(--space-4)" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "s9bu6v4", "line-height:1.6" ] ] ], [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::white-space", [ "::white-space", [ "s41qynl", "white-space:pre-wrap" ] ] ], [ "::min-height", [ "::min-height", [ "sonk3zu", "min-height:96px" ] ] ], [ "::max-height", [ "::max-height", [ "s1sw9ehx", "max-height:240px" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ] ]) ] ];
const diag_error = [ [ new Map([ [ "::color", [ "::color", [ "s1j2narg", "color:#EB682E" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzhdq", "font-weight:700" ] ] ] ]) ] ];
const diag_warning = [ [ new Map([ [ "::color", [ "::color", [ "s1itpo6m", "color:#E5AFD9" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzhdq", "font-weight:700" ] ] ] ]) ] ];
const diag_site = [ [ new Map([ [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ] ]) ] ];
const diag_note = [ [ new Map([ [ "::opacity", [ "::opacity", [ "s3a4eu", "opacity:0.7" ] ] ] ]) ] ];
const console_error = [ [ new Map([ [ "::color", [ "::color", [ "s1j2narg", "color:#EB682E" ] ] ] ]) ] ];
const quiet_row = [ [ new Map([ [ "::opacity", [ "::opacity", [ "s30a1k8", "opacity:0.45" ] ] ] ]) ] ];
const topbar = [ [ new Map([ [ "::position", [ "::position", [ "s1onro1c", "position:sticky" ] ] ], [ "::top", [ "::top", [ "s80ttlx", "top:0" ] ] ], [ "::z-index", [ "::z-index", [ "si5ywm6", "z-index:100" ] ] ], [ "::background", [ "::background", [ "s10uy5mh", "background:rgba(18, 0, 4, calc(var(--nav-fade, 0) * 0.86))" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "s143oef3", "border-bottom:1px solid rgba(249, 223, 231, calc(var(--nav-fade, 0) * 0.10))" ] ] ], [ "::backdrop-filter", [ "::backdrop-filter", [ "shx44pg", "backdrop-filter:blur(calc(var(--nav-fade, 0) * 14px))" ] ] ] ]) ] ];
const nav_row = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ], [ "::height", [ "::height", [ "s2310lv", "height:64px" ] ] ] ]) ] ];
const nav_brand = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odkmbv", "letter-spacing:0.35em" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ] ]) ] ];
const nav_links = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::gap", [ "::gap", [ "s8myyte", "gap:var(--space-6)" ] ] ] ]) ] ];
const nav_link = [ [ new Map([ [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4ev", "opacity:0.8" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "srapg3a", "opacity:1" ] ] ] ]) ] ];
const assets = "https://vilan-lang.org/assets";
const shell = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dcp4lt", "background-color:#120004" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::min-height", [ "::min-height", [ "sondrfd", "min-height:100%" ] ] ], [ "::font-family", [ "::font-family", [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayk3oa", "font-size:14px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8cl8", "line-height:18px" ] ] ] ]) ] ];
const column = [ [ new Map([ [ "::max-width", [ "::max-width", [ "s1eamei2", "max-width:1264px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vtg8d6", "padding-left:32px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t4hls", "padding-right:32px" ] ] ] ]) ] ];
const no_drag = [ [ new Map([ [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const console_cap = 300;
const status = $a("Loading the compiler\u{2026}");
const diagnostics = $b([  ]);
const console_lines = $c([  ]);
const can_format = $d(false);
const can_platform = $d(false);
const mode = $a("browser");
const share_label = $a("Share");
const next_row_id = __shared_new(0);
const run = () => {
	if (VilanPlayground.compile(VilanPlayground.value())) {
		$e(status, "Compiling\u{2026}", [ 1 ]);
	} else {
		$e(status, "Compiler busy; queued.", [ 1 ]);
	}
	return;
};
const format = () => {
	if (!(VilanPlayground.format())) {
		$e(status, "Compiler busy; try again.", [ 1 ]);
	}
	return;
};
const share = () => {
	return VilanPlayground.share();
};
const pick = (name) => {
	const $o = name;
	let $p = null;
	if ($o === "server") {
		$p = "node";
	} else {
		$p = "browser";
	}
	const platform = $p;
	VilanPlayground.setMode(platform);
	VilanPlayground.setDoc(VilanPlayground.example(name));
	$q(diagnostics, [  ], [ 1 ]);
	$w(console_lines, [  ], [ 1 ]);
	run();
	return;
};
const compiler_ready = __shared_new(false);
const doc_ready = __shared_new(false);
const ran_on_arrival = __shared_new(false);
const run_on_arrival = () => {
	if (compiler_ready.v && doc_ready.v && !(ran_on_arrival.v)) {
		ran_on_arrival.v = true;
		run();
	}
	return;
};
const share_revert = __shared_new([ 1 ]);
const flash_share = (label) => {
	$e(share_label, label, [ 1 ]);
	const $C = share_revert.v;
	let $D = null;
	if ($C[0] === 0) {
		const timer = $C[1];
		$D = cancel(timer);
	} else {
		$D = undefined;
	}
	$D;
	const timer2 = after(1600);
	share_revert.v = [ 0, __clone(timer2) ];
	__task(async () => {
		if (await (wait(timer2, [ 1 ]))) {
			$e(share_label, "Share", [ 1 ]);
		}
		return;
	}, "main");
	return;
};
const apply_diagnostics = (event) => {
	let rows = [  ];
	let id = next_row_id.v;
	for (const diagnostic of event.diagnostics) {
		rows.push([ id, diagnostic.severity, diagnostic.file, diagnostic.line + 1, diagnostic.column + 1, diagnostic.message, diagnostic.note ]);
		id = id + 1;
	}
	next_row_id.v = id;
	$I(diagnostics, rows, [ 1 ]);
	return rows.length;
};
mount_root("app", ($O) => {
	return playground_page(status, diagnostics, console_lines, can_format, can_platform, share_label, mode, run, format, share, [ 1 ], $O);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $bH = null;
	if (kind === "ready") {
		$aT(can_format, event.canFormat, [ 1 ]);
		$aT(can_platform, event.canPlatform, [ 1 ]);
		if (!(event.canPlatform)) {
			VilanPlayground.setMode("browser");
		}
		$e(status, "Ready (vilan " + event.version + ")", [ 1 ]);
		compiler_ready.v = true;
		run_on_arrival();
	} else if (kind === "doc") {
		doc_ready.v = true;
		run_on_arrival();
	} else if (kind === "command") {
		const command = event.command;
		if (command === "run") {
			run();
		} else if (command === "format") {
			format();
		} else if (command === "pick") {
			pick(event.name);
		} else if (command === "mode") {
			$e(mode, event.name, [ 1 ]);
		}
		$bH = undefined;
	} else if (kind === "formatted") {
		if (event.changed) {
			$e(status, "Formatted.", [ 1 ]);
		} else {
			$e(status, "Format made no changes.", [ 1 ]);
		}
		$bH = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			$e(status, "Link copied to the clipboard.", [ 1 ]);
			flash_share("Copied!");
		} else {
			$e(status, "Link ready in the address bar.", [ 1 ]);
			flash_share("Link ready");
		}
		$bH = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $bI = null;
		if (event.ok) {
			if (event.platform === "node") {
				$e(status, "No problems (server check, vilan " + event.version + ").", [ 1 ]);
			} else {
				$e(status, "No problems (vilan " + event.version + ").", [ 1 ]);
			}
			$bI = undefined;
		} else if (count === 1) {
			$e(status, "1 problem; see the diagnostics.", [ 1 ]);
		} else {
			$e(status, "" + count + " problems; see the diagnostics.", [ 1 ]);
		}
		$bH = $bI;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $bJ = null;
		if (event.platform === "node") {
			if (event.ok) {
				$e(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ]);
			} else {
				$e(status, "Build failed; see the diagnostics.", [ 1 ]);
			}
			$bJ = undefined;
		} else {
			$bK(console_lines, [  ], [ 1 ]);
			if (event.ok) {
				$e(status, "Compiled (vilan " + event.version + ")", [ 1 ]);
				VilanPlayground.runProgram(event.js, event.css);
			} else {
				$e(status, "Build failed; see the diagnostics.", [ 1 ]);
				VilanPlayground.clearProgram();
			}
			$bJ = undefined;
		}
		$bH = $bJ;
	} else if (kind === "crash") {
		$e(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $bH;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const kind = message.kind;
	if (kind === "log" || kind === "error") {
		$bQ(console_lines, (lines) => {
			let next = __clone(lines);
			if (next.length < console_cap) {
				const id = next_row_id.v;
				next_row_id.v = id + 1;
				next.push([ id, kind, message.text ]);
			} else if (next.length === console_cap) {
				const id2 = next_row_id.v;
				next_row_id.v = id2 + 1;
				next.push([ id2, "error", "[output truncated]" ]);
			}
			return next;
		}, [ 1 ]);
	}
	return;
});
