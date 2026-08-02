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
			turn[0].v.push(subscriber);
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
		draining_turns.v.push(turn);
		let budget = 100000;
		while (!($i(turn[0].v)) && budget > 0) {
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
function dispose(self, $au) {
	let kept = [  ];
	for (const subscriber of self[0].v) {
		if (subscriber[0] !== self[1]) {
			kept.push(subscriber);
		}
	}
	self[0].v = kept;
	const $av = $au;
	let $aw = null;
	if ($av[0] === 0) {
		const turn = $av[1];
		let kept_pending = [  ];
		for (const subscriber2 of turn[0].v) {
			if (subscriber2[0] !== self[1]) {
				kept_pending.push(subscriber2);
			}
		}
		turn[0].v = kept_pending;
		$aw = undefined;
	} else {
		$aw = undefined;
	}
	return $aw;
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
function get_owner($ar) {
	return $ar;
}
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $A) {
	return await (self[0].wait(ambient_signal($A)));
}
function cancel(self) {
	self[0].cancel();
}
function ambient_signal($B) {
	const $C = $B;
	let $D = null;
	if ($C[0] === 0) {
		const n = $C[1];
		$D = [ 0, n.signal_of() ];
	} else {
		$D = [ 1 ];
	}
	return $D;
}
function view(tag) {
	let $O = null;
	if (is_svg_tag(tag)) {
		$O = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$O = [ document.createElement(tag) ];
	}
	return $O;
}
function is_svg_tag(tag) {
	const $M = tag;
	let $N = null;
	if ($M === "svg") {
		$N = true;
	} else if ($M === "path") {
		$N = true;
	} else if ($M === "circle") {
		$N = true;
	} else if ($M === "ellipse") {
		$N = true;
	} else if ($M === "rect") {
		$N = true;
	} else if ($M === "line") {
		$N = true;
	} else if ($M === "polyline") {
		$N = true;
	} else if ($M === "polygon") {
		$N = true;
	} else if ($M === "g") {
		$N = true;
	} else if ($M === "defs") {
		$N = true;
	} else if ($M === "use") {
		$N = true;
	} else if ($M === "symbol") {
		$N = true;
	} else if ($M === "marker") {
		$N = true;
	} else if ($M === "pattern") {
		$N = true;
	} else if ($M === "mask") {
		$N = true;
	} else if ($M === "clipPath") {
		$N = true;
	} else if ($M === "linearGradient") {
		$N = true;
	} else if ($M === "radialGradient") {
		$N = true;
	} else if ($M === "stop") {
		$N = true;
	} else if ($M === "text") {
		$N = true;
	} else if ($M === "tspan") {
		$N = true;
	} else if ($M === "textPath") {
		$N = true;
	} else if ($M === "filter") {
		$N = true;
	} else if ($M === "foreignObject") {
		$N = true;
	} else if ($M === "feGaussianBlur") {
		$N = true;
	} else if ($M === "feColorMatrix") {
		$N = true;
	} else if ($M === "feOffset") {
		$N = true;
	} else if ($M === "feMerge") {
		$N = true;
	} else if ($M === "feMergeNode") {
		$N = true;
	} else if ($M === "feFlood") {
		$N = true;
	} else if ($M === "feComposite") {
		$N = true;
	} else if ($M === "feBlend") {
		$N = true;
	} else if ($M === "feDropShadow") {
		$N = true;
	} else {
		$N = false;
	}
	return $N;
}
function text(self, content) {
	self[0].textContent = content;
	return self;
}
function styled(self, style) {
	self[0].setAttribute("class", class_list(style));
	return self;
}
function style_var(self, name, source) {
	const element = __clone(self[0]);
	$aa(source, (value) => {
		return element.style.setProperty(name, value);
	});
	return self;
}
function on(self, event, handler) {
	self[0].addEventListener(event, () => {
		return $az([ 1 ], ($ay) => {
			return handler($ay);
		});
	});
	return self;
}
function bind_text(self, source, $am, $an) {
	const element = __clone(self[0]);
	$ao(source, (value) => {
		element.textContent = value;
		return;
	}, $am, $an);
	return self;
}
function show(self, condition, $aA, $aB) {
	const element = __clone(self[0]);
	$aC(condition, (visible) => {
		element.hidden = !(visible);
		return;
	}, $aA, $aB);
	return self;
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
	const $bx = $bw([ 1 ], ($bu) => {
		return $bv(body);
	});
	const built = $bx[0];
	const root = $bx[1];
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
	for (const entry of $W(self[0])) {
		const $X = entry;
		const class2 = $X[0];
		const _declaration = $X[1];
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
	for (const key of $P(b[0])) {
		const $T = $Q(b[0], key);
		let $U = null;
		if ($T[0] === 0) {
			const entry = $T[1];
			$U = $V(rules, key, entry);
		} else {
			$U = undefined;
		}
		$U;
	}
	return [ rules ];
}
function template_option(value, label, $aF, $aG) {
	return text($ac(view("option"), "value", value, $aF, $aG), label);
}
function severity_tag(row) {
	const $aT = row[1];
	let $aU = null;
	if ($aT === "error") {
		$aU = text(styled(view("span"), diag_error), "error");
	} else {
		$aU = text(styled(view("span"), diag_warning), "warning");
	}
	return $aU;
}
function diagnostic_row(row, $aR, $aS) {
	const head = $af($af($af(view("div"), severity_tag(row), $aR, $aS), text(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " "), $aR, $aS), text(view("span"), row[5]), $aR, $aS);
	const $aV = row[6];
	let $aW = null;
	if ($aV === "") {
		$aW = head;
	} else {
		$aW = $af($af(view("div"), head, $aR, $aS), text(styled(view("div"), diag_note), "  note: " + row[6]), $aR, $aS);
	}
	return $aW;
}
function console_row(row) {
	const $bn = row[1];
	let $bo = null;
	if ($bn === "error") {
		$bo = text(styled(view("div"), console_error), row[2]);
	} else {
		$bo = text(view("div"), row[2]);
	}
	return $bo;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, share_label2, mode2, run2, format2, share2, $K, $L) {
	return $af($af(styled(view("div"), add(shell, page_fill)), top_bar($a("1"), $K, $L), $K, $L), $af($af($af(styled(view("main"), add(wide_column, workbench)), text(styled(view("h1"), pane_label), "Playground: vilan in the browser"), $K, $L), $af($af($af($af($af($af(styled(view("div"), controls), on(bind_text(styled(view("button"), run_button), $ak(mode2, (current) => {
		const $ai = current;
		let $aj = null;
		if ($ai === "node") {
			$aj = "Check";
		} else {
			$aj = "Run";
		}
		return $aj;
	}, $K), $K, $L), "click", ($ax) => {
		return run2();
	}), $K, $L), $af($af(show($ac($ac(styled(view("select"), template_select), "id", "mode", $K, $L), "aria-label", "Compile mode", $K, $L), can_platform2, $K, $L), template_option("browser", "Browser: compile and run", $K, $L), $K, $L), template_option("node", "Server: check the process leg", $K, $L), $K, $L), $K, $L), show(on(text(styled(view("button"), example_button), "Format"), "click", ($aH) => {
		return format2();
	}), can_format2, $K, $L), $K, $L), on(bind_text(styled(view("button"), example_button), share_label2, $K, $L), "click", ($aI) => {
		return share2();
	}), $K, $L), bind_text($ac(styled(view("p"), status_line), "role", "status", $K, $L), status2, $K, $L), $K, $L), $ac($ac(styled(view("select"), template_select), "id", "version", $K, $L), "aria-label", "Compiler version", $K, $L), $K, $L), $K, $L), $af($af(styled(view("div"), panes), $af($af($af($af(styled(view("div"), pane), $af($af(styled(view("div"), pane_head), text(styled(view("p"), pane_label), "Program"), $K, $L), $af($af($af($af($af($ac($ac(styled(view("select"), template_select), "id", "template", $K, $L), "aria-label", "Load an example", $K, $L), text($ac($ac($ac(view("option"), "value", "", $K, $L), "disabled", "true", $K, $L), "hidden", "true", $K, $L), "Examples"), $K, $L), template_option("counter", "Counter: reactive state", $K, $L), $K, $L), template_option("hello", "Hello: mount and print", $K, $L), $K, $L), template_option("styles", "Styles: compile-time CSS", $K, $L), $K, $L), show(template_option("server", "Server: typed HTTP, checked", $K, $L), can_platform2, $K, $L), $K, $L), $K, $L), $K, $L), $ac($ac(styled(view("div"), editor_host), "id", "editor", $K, $L), "aria-label", "Program editor", $K, $L), $K, $L), text(styled(view("p"), pane_label), "Diagnostics"), $K, $L), $af($af(styled(view("pre"), report_pre), show(text(styled(view("div"), quiet_row), "Nothing to report."), $aJ(diagnostics2, (rows) => {
		return rows.length === 0;
	}, $K), $K, $L), $K, $L), $aX(view("div"), diagnostics2, (row) => {
		return row[0];
	}, (row, $aQ) => {
		return diagnostic_row(row, $K, $aQ);
	}, $K, $L), $K, $L), $K, $L), $K, $L), $af($af($af($af(styled(view("div"), pane), text(styled(view("p"), pane_label), "Result"), $K, $L), $ac($ac(styled(view("div"), runner_host), "id", "runner", $K, $L), "aria-label", "Program result", $K, $L), $K, $L), text(styled(view("p"), pane_label), "Console"), $K, $L), $af($af(styled(view("pre"), report_pre), show(text(styled(view("div"), quiet_row), "Program output lands here."), $bk(console_lines2, (rows) => {
		return rows.length === 0;
	}, $K), $K, $L), $K, $L), $bp(view("div"), console_lines2, (row) => {
		return row[0];
	}, (row, $bm) => {
		return console_row(row);
	}, $K, $L), $K, $L), $K, $L), $K, $L), $K, $L), $K, $L);
}
function eq(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2] && self[3] === other[3] && self[4] === other[4] && self[5] === other[5] && self[6] === other[6];
}
function eq2(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2];
}
function top_bar(scroll_fade, $Y, $Z) {
	return $af(style_var(styled(view("nav"), topbar), "--nav-fade", scroll_fade), $af($af(styled(view("div"), add(column, nav_row)), $af($af($ac(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $Y, $Z), $ac($ac($ac(styled(view("img"), no_drag), "src", "" + assets + "/mark.svg", $Y, $Z), "alt", "", $Y, $Z), "height", "18", $Y, $Z), $Y, $Z), text(view("span"), "VILAN"), $Y, $Z), $Y, $Z), $af($af($af(styled(view("div"), nav_links), text($ac(styled(view("a"), nav_link), "href", "#install", $Y, $Z), "Install"), $Y, $Z), text($ac(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html", $Y, $Z), "Learn"), $Y, $Z), text($ac(styled(view("a"), nav_link), "href", "/docs/", $Y, $Z), "Docs"), $Y, $Z), $Y, $Z), $Y, $Z);
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
function $i(self) {
	return self.length === 0;
}
function $j(self) {
	return __list_get(self, self.length - 1);
}
function $e(self, value, $f) {
	self[0].v = value;
	const $g = $f;
	let $h = null;
	if ($g[0] === 0) {
		const turn = $g[1];
		$h = enqueue(turn, self[1].v);
	} else {
		const $k = $j(draining_turns.v);
		let $l = null;
		if ($k[0] === 0) {
			const draining = $k[1];
			$l = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$l = undefined;
		}
		$h = $l;
	}
	return $h;
}
function $o(self, value, $f) {
	self[0].v = value;
	const $p = $f;
	let $q = null;
	if ($p[0] === 0) {
		const turn = $p[1];
		$q = enqueue(turn, self[1].v);
	} else {
		const $r = $j(draining_turns.v);
		let $s = null;
		if ($r[0] === 0) {
			const draining = $r[1];
			$s = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$s = undefined;
		}
		$q = $s;
	}
	return $q;
}
function $t(self, value, $f) {
	self[0].v = value;
	const $u = $f;
	let $v = null;
	if ($u[0] === 0) {
		const turn = $u[1];
		$v = enqueue(turn, self[1].v);
	} else {
		const $w = $j(draining_turns.v);
		let $x = null;
		if ($w[0] === 0) {
			const draining = $w[1];
			$x = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$x = undefined;
		}
		$v = $x;
	}
	return $v;
}
function $E(self, value, $f) {
	self[0].v = value;
	const $F = $f;
	let $G = null;
	if ($F[0] === 0) {
		const turn = $F[1];
		$G = enqueue(turn, self[1].v);
	} else {
		const $H = $j(draining_turns.v);
		let $I = null;
		if ($H[0] === 0) {
			const draining = $H[1];
			$I = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$I = undefined;
		}
		$G = $I;
	}
	return $G;
}
function $P(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(entry[0]);
	}
	return result;
}
function $Q(self, key) {
	const $R = __map_get(self[0], hash(key));
	let $S = null;
	if ($R[0] === 0) {
		const entry = $R[1];
		$S = [ 0, entry[1] ];
	} else {
		$S = [ 1 ];
	}
	return $S;
}
function $V(self, key, value) {
	self[0].set(hash(key), [ key, value ]);
}
function $W(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(entry[1]);
	}
	return result;
}
function $ab(self) {
	return self[0].v;
}
function $aa(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($ab(self));
		return;
	} ]);
	observer($ab(self));
	return [ self[1], id ];
}
function $ac(self, name, value, $ad, $ae) {
	apply(value, self, name, $ad, $ae);
	return self;
}
function $af(self, content, $ag, $ah) {
	place(content, self, $ag, $ah);
	return self;
}
function $ak(self, transform, $al) {
	const derived = $a(transform($ab(self)));
	self[1].v.push([ fresh_id(), () => {
		$e(derived, transform($ab(self)), $al);
		return;
	} ]);
	return derived;
}
function $as(self, item, $at) {
	self[0].v.push(() => {
		dispose(item, $at);
		return;
	});
	return item;
}
function $ao(self, observer, $ap, $aq) {
	$as(get_owner($aq), $aa(self, observer), $ap);
}
function $az(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $aE(self) {
	return self[0].v;
}
function $aD(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($aE(self));
		return;
	} ]);
	observer($aE(self));
	return [ self[1], id ];
}
function $aC(self, observer, $ap, $aq) {
	$as(get_owner($aq), $aD(self, observer), $ap);
}
function $aK(self) {
	return self[0].v;
}
function $aL(self, value, $f) {
	self[0].v = value;
	const $aM = $f;
	let $aN = null;
	if ($aM[0] === 0) {
		const turn = $aM[1];
		$aN = enqueue(turn, self[1].v);
	} else {
		const $aO = $j(draining_turns.v);
		let $aP = null;
		if ($aO[0] === 0) {
			const draining = $aO[1];
			$aP = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$aP = undefined;
		}
		$aN = $aP;
	}
	return $aN;
}
function $aJ(self, transform, $al) {
	const derived = $d(transform($aK(self)));
	self[1].v.push([ fresh_id(), () => {
		$aL(derived, transform($aK(self)), $al);
		return;
	} ]);
	return derived;
}
function $ba(old_keys, old_items, items, key_of) {
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
				let $bb = null;
				if (eq(__at(old_items, index), item)) {
					$bb = [ 0, index ];
				} else {
					$bb = [ 1, index ];
				}
				step = $bb;
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
	return [ steps, removed ];
}
function $bf(owner, body) {
	return body(owner);
}
function $bj(self) {
	return self[0].v;
}
function $bi(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($bj(self));
		return;
	} ]);
	observer($bj(self));
	return [ self[1], id ];
}
function $bh(self, observer, $ap, $aq) {
	$as(get_owner($aq), $bi(self, observer), $ap);
}
function $aX(self, source, key, render, $aY, $aZ) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($aZ), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$bh(source, (list) => {
		const plan = $ba(row_keys.v, row_items.v, list, key);
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
			const item = __at(list, position);
			const $bc = step;
			let $bd = null;
			if ($bc[0] === 0) {
				const index2 = $bc[1];
				next_views.push(__at(previous_views, index2));
				next_owners.push(__at(previous_owners, index2));
				$bd = undefined;
			} else if ($bc[0] === 1) {
				const index3 = $bc[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bf(owner, ($be) => {
					return render(item, $be);
				}));
				next_owners.push(owner);
				$bd = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bf(owner2, ($bg) => {
					return render(item, $bg);
				}));
				next_owners.push(owner2);
				$bd = undefined;
			}
			$bd;
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
	}, $aY, $aZ);
	return self;
}
function $bl(self) {
	return self[0].v;
}
function $bk(self, transform, $al) {
	const derived = $d(transform($bl(self)));
	self[1].v.push([ fresh_id(), () => {
		$aL(derived, transform($bl(self)), $al);
		return;
	} ]);
	return derived;
}
function $bq(old_keys, old_items, items, key_of) {
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
				let $br = null;
				if (eq2(__at(old_items, index), item)) {
					$br = [ 0, index ];
				} else {
					$br = [ 1, index ];
				}
				step = $br;
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
	return [ steps, removed ];
}
function $bp(self, source, key, render, $aY, $aZ) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($aZ), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$bh(source, (list) => {
		const plan = $bq(row_keys.v, row_items.v, list, key);
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
			const item = __at(list, position);
			const $bs = step;
			let $bt = null;
			if ($bs[0] === 0) {
				const index2 = $bs[1];
				next_views.push(__at(previous_views, index2));
				next_owners.push(__at(previous_owners, index2));
				$bt = undefined;
			} else if ($bs[0] === 1) {
				const index3 = $bs[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bf(owner, ($be) => {
					return render(item, $be);
				}));
				next_owners.push(owner);
				$bt = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bf(owner2, ($bg) => {
					return render(item, $bg);
				}));
				next_owners.push(owner2);
				$bt = undefined;
			}
			$bt;
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
	}, $aY, $aZ);
	return self;
}
function $bv(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, scope ];
}
function $bw(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $bB(self, value, $f) {
	self[0].v = value;
	const $bC = $f;
	let $bD = null;
	if ($bC[0] === 0) {
		const turn = $bC[1];
		$bD = enqueue(turn, self[1].v);
	} else {
		const $bE = $j(draining_turns.v);
		let $bF = null;
		if ($bE[0] === 0) {
			const draining = $bE[1];
			$bF = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bF = undefined;
		}
		$bD = $bF;
	}
	return $bD;
}
function $bI(self) {
	return self[0].v;
}
function $bJ(self, value, $f) {
	self[0].v = value;
	const $bK = $f;
	let $bL = null;
	if ($bK[0] === 0) {
		const turn = $bK[1];
		$bL = enqueue(turn, self[1].v);
	} else {
		const $bM = $j(draining_turns.v);
		let $bN = null;
		if ($bM[0] === 0) {
			const draining = $bM[1];
			$bN = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bN = undefined;
		}
		$bL = $bN;
	}
	return $bL;
}
function $bG(self, transform, $bH) {
	$bJ(self, transform($bI(self)), $bH);
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
	const $m = name;
	let $n = null;
	if ($m === "server") {
		$n = "node";
	} else {
		$n = "browser";
	}
	const platform = $n;
	VilanPlayground.setMode(platform);
	VilanPlayground.setDoc(VilanPlayground.example(name));
	$o(diagnostics, [  ], [ 1 ]);
	$t(console_lines, [  ], [ 1 ]);
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
	const $y = share_revert.v;
	let $z = null;
	if ($y[0] === 0) {
		const timer = $y[1];
		$z = cancel(timer);
	} else {
		$z = undefined;
	}
	$z;
	const timer2 = after(1600);
	share_revert.v = [ 0, timer2 ];
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
	$E(diagnostics, rows, [ 1 ]);
	return rows.length;
};
mount_root("app", ($J) => {
	return playground_page(status, diagnostics, console_lines, can_format, can_platform, share_label, mode, run, format, share, [ 1 ], $J);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $by = null;
	if (kind === "ready") {
		$aL(can_format, event.canFormat, [ 1 ]);
		$aL(can_platform, event.canPlatform, [ 1 ]);
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
		$by = undefined;
	} else if (kind === "formatted") {
		if (event.changed) {
			$e(status, "Formatted.", [ 1 ]);
		} else {
			$e(status, "Format made no changes.", [ 1 ]);
		}
		$by = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			$e(status, "Link copied to the clipboard.", [ 1 ]);
			flash_share("Copied!");
		} else {
			$e(status, "Link ready in the address bar.", [ 1 ]);
			flash_share("Link ready");
		}
		$by = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $bz = null;
		if (event.ok) {
			if (event.platform === "node") {
				$e(status, "No problems (server check, vilan " + event.version + ").", [ 1 ]);
			} else {
				$e(status, "No problems (vilan " + event.version + ").", [ 1 ]);
			}
			$bz = undefined;
		} else if (count === 1) {
			$e(status, "1 problem; see the diagnostics.", [ 1 ]);
		} else {
			$e(status, "" + count + " problems; see the diagnostics.", [ 1 ]);
		}
		$by = $bz;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $bA = null;
		if (event.platform === "node") {
			if (event.ok) {
				$e(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ]);
			} else {
				$e(status, "Build failed; see the diagnostics.", [ 1 ]);
			}
			$bA = undefined;
		} else {
			$bB(console_lines, [  ], [ 1 ]);
			if (event.ok) {
				$e(status, "Compiled (vilan " + event.version + ")", [ 1 ]);
				VilanPlayground.runProgram(event.js, event.css);
			} else {
				$e(status, "Build failed; see the diagnostics.", [ 1 ]);
				VilanPlayground.clearProgram();
			}
			$bA = undefined;
		}
		$by = $bA;
	} else if (kind === "crash") {
		$e(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $by;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const kind = message.kind;
	if (kind === "log" || kind === "error") {
		$bG(console_lines, (lines) => {
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
