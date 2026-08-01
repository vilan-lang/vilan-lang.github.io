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
function dispose(self, $am) {
	let kept = [  ];
	for (const subscriber of self[0].v) {
		if (subscriber[0] !== self[1]) {
			kept.push(subscriber);
		}
	}
	self[0].v = kept;
	const $an = $am;
	let $ao = null;
	if ($an[0] === 0) {
		const turn = $an[1];
		let kept_pending = [  ];
		for (const subscriber2 of turn[0].v) {
			if (subscriber2[0] !== self[1]) {
				kept_pending.push(subscriber2);
			}
		}
		turn[0].v = kept_pending;
		$ao = undefined;
	} else {
		$ao = undefined;
	}
	return $ao;
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
function get_owner($ah) {
	return $ah;
}
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $y) {
	return await (self[0].wait(ambient_signal($y)));
}
function cancel(self) {
	self[0].cancel();
}
function ambient_signal($z) {
	const $A = $z;
	let $B = null;
	if ($A[0] === 0) {
		const n = $A[1];
		$B = [ 0, n.signal_of() ];
	} else {
		$B = [ 1 ];
	}
	return $B;
}
function view(tag) {
	let $M = null;
	if (is_svg_tag(tag)) {
		$M = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$M = [ document.createElement(tag) ];
	}
	return $M;
}
function is_svg_tag(tag) {
	const $K = tag;
	let $L = null;
	if ($K === "svg") {
		$L = true;
	} else if ($K === "path") {
		$L = true;
	} else if ($K === "circle") {
		$L = true;
	} else if ($K === "ellipse") {
		$L = true;
	} else if ($K === "rect") {
		$L = true;
	} else if ($K === "line") {
		$L = true;
	} else if ($K === "polyline") {
		$L = true;
	} else if ($K === "polygon") {
		$L = true;
	} else if ($K === "g") {
		$L = true;
	} else if ($K === "defs") {
		$L = true;
	} else if ($K === "use") {
		$L = true;
	} else if ($K === "symbol") {
		$L = true;
	} else if ($K === "marker") {
		$L = true;
	} else if ($K === "pattern") {
		$L = true;
	} else if ($K === "mask") {
		$L = true;
	} else if ($K === "clipPath") {
		$L = true;
	} else if ($K === "linearGradient") {
		$L = true;
	} else if ($K === "radialGradient") {
		$L = true;
	} else if ($K === "stop") {
		$L = true;
	} else if ($K === "text") {
		$L = true;
	} else if ($K === "tspan") {
		$L = true;
	} else if ($K === "textPath") {
		$L = true;
	} else if ($K === "filter") {
		$L = true;
	} else if ($K === "foreignObject") {
		$L = true;
	} else if ($K === "feGaussianBlur") {
		$L = true;
	} else if ($K === "feColorMatrix") {
		$L = true;
	} else if ($K === "feOffset") {
		$L = true;
	} else if ($K === "feMerge") {
		$L = true;
	} else if ($K === "feMergeNode") {
		$L = true;
	} else if ($K === "feFlood") {
		$L = true;
	} else if ($K === "feComposite") {
		$L = true;
	} else if ($K === "feBlend") {
		$L = true;
	} else if ($K === "feDropShadow") {
		$L = true;
	} else {
		$L = false;
	}
	return $L;
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
	$W(source, (value) => {
		return element.style.setProperty(name, value);
	});
	return self;
}
function attr(self, name, value) {
	self[0].setAttribute(name, value);
	return self;
}
function on(self, event, handler) {
	self[0].addEventListener(event, () => {
		return $aa([ 1 ], ($Z) => {
			return handler($Z);
		});
	});
	return self;
}
function child(self, child2) {
	self[0].appendChild(child2[0]);
	return self;
}
function bind_text(self, source, $ap, $aq) {
	const element = __clone(self[0]);
	$ar(source, (value) => {
		element.textContent = value;
		return;
	}, $ap, $aq);
	return self;
}
function show(self, condition, $ac, $ad) {
	const element = __clone(self[0]);
	$ae(condition, (visible) => {
		element.hidden = !(visible);
		return;
	}, $ac, $ad);
	return self;
}
function mount(id, view2) {
	const element = document.getElementById(id);
	element.replaceChildren();
	element.appendChild(view2[0]);
}
function mount_root(id, body) {
	const $bg = $bf([ 1 ], ($bd) => {
		return $be(body);
	});
	const built = $bg[0];
	const root = $bg[1];
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
	for (const entry of $U(self[0])) {
		const $V = entry;
		const class2 = $V[0];
		const _declaration = $V[1];
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
	for (const key of $N(b[0])) {
		const $R = $O(b[0], key);
		let $S = null;
		if ($R[0] === 0) {
			const entry = $R[1];
			$S = $T(rules, key, entry);
		} else {
			$S = undefined;
		}
		$S;
	}
	return [ rules ];
}
function template_option(value, label) {
	return text(attr(view("option"), "value", value), label);
}
function severity_tag(row) {
	const $aC = row[1];
	let $aD = null;
	if ($aC === "error") {
		$aD = text(styled(view("span"), diag_error), "error");
	} else {
		$aD = text(styled(view("span"), diag_warning), "warning");
	}
	return $aD;
}
function diagnostic_row(row) {
	const head = child(child(child(view("div"), severity_tag(row)), text(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " ")), text(view("span"), row[5]));
	const $aE = row[6];
	let $aF = null;
	if ($aE === "") {
		$aF = head;
	} else {
		$aF = child(child(view("div"), head), text(styled(view("div"), diag_note), "  note: " + row[6]));
	}
	return $aF;
}
function console_row(row) {
	const $aW = row[1];
	let $aX = null;
	if ($aW === "error") {
		$aX = text(styled(view("div"), console_error), row[2]);
	} else {
		$aX = text(view("div"), row[2]);
	}
	return $aX;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, share_label2, run2, format2, share2, $I, $J) {
	return child(child(styled(view("div"), add(shell, page_fill)), top_bar($a("1"))), child(child(child(styled(view("main"), add(wide_column, workbench)), text(styled(view("h1"), pane_label), "Playground: vilan in the browser")), child(child(child(child(styled(view("div"), controls), on(text(styled(view("button"), run_button), "Run"), "click", ($Y) => {
		return run2();
	})), show(on(text(styled(view("button"), example_button), "Format"), "click", ($ab) => {
		return format2();
	}), can_format2, $I, $J)), on(bind_text(styled(view("button"), example_button), share_label2, $I, $J), "click", ($as) => {
		return share2();
	})), bind_text(attr(styled(view("p"), status_line), "role", "status"), status2, $I, $J))), child(child(styled(view("div"), panes), child(child(child(child(styled(view("div"), pane), child(child(styled(view("div"), pane_head), text(styled(view("p"), pane_label), "Program")), child(child(child(child(attr(attr(styled(view("select"), template_select), "id", "template"), "aria-label", "Load an example"), text(attr(attr(attr(view("option"), "value", ""), "disabled", "true"), "hidden", "true"), "Examples")), template_option("counter", "Counter: reactive state")), template_option("hello", "Hello: mount and print")), template_option("styles", "Styles: compile-time CSS")))), attr(attr(styled(view("div"), editor_host), "id", "editor"), "aria-label", "Program editor")), text(styled(view("p"), pane_label), "Diagnostics")), child(child(styled(view("pre"), report_pre), show(text(styled(view("div"), quiet_row), "Nothing to report."), $at(diagnostics2, (rows) => {
		return rows.length === 0;
	}, $I), $I, $J)), $aG(view("div"), diagnostics2, (row) => {
		return row[0];
	}, (row, $aB) => {
		return diagnostic_row(row);
	}, $I, $J)))), child(child(child(child(styled(view("div"), pane), text(styled(view("p"), pane_label), "Result")), attr(attr(styled(view("div"), runner_host), "id", "runner"), "aria-label", "Program result")), text(styled(view("p"), pane_label), "Console")), child(child(styled(view("pre"), report_pre), show(text(styled(view("div"), quiet_row), "Program output lands here."), $aT(console_lines2, (rows) => {
		return rows.length === 0;
	}, $I), $I, $J)), $aY(view("div"), console_lines2, (row) => {
		return row[0];
	}, (row, $aV) => {
		return console_row(row);
	}, $I, $J))))));
}
function eq(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2] && self[3] === other[3] && self[4] === other[4] && self[5] === other[5] && self[6] === other[6];
}
function eq2(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2];
}
function top_bar(scroll_fade) {
	return child(style_var(styled(view("nav"), topbar), "--nav-fade", scroll_fade), child(child(styled(view("div"), add(column, nav_row)), child(child(attr(styled(view("a"), add(nav_brand, nav_link)), "href", "/"), attr(attr(attr(styled(view("img"), no_drag), "src", "" + assets + "/mark.svg"), "alt", ""), "height", "18")), text(view("span"), "VILAN"))), child(child(child(styled(view("div"), nav_links), text(attr(styled(view("a"), nav_link), "href", "#install"), "Install")), text(attr(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html"), "Learn")), text(attr(styled(view("a"), nav_link), "href", "/docs/"), "Docs"))));
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
function $m(self, value, $f) {
	self[0].v = value;
	const $n = $f;
	let $o = null;
	if ($n[0] === 0) {
		const turn = $n[1];
		$o = enqueue(turn, self[1].v);
	} else {
		const $p = $j(draining_turns.v);
		let $q = null;
		if ($p[0] === 0) {
			const draining = $p[1];
			$q = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$q = undefined;
		}
		$o = $q;
	}
	return $o;
}
function $r(self, value, $f) {
	self[0].v = value;
	const $s = $f;
	let $t = null;
	if ($s[0] === 0) {
		const turn = $s[1];
		$t = enqueue(turn, self[1].v);
	} else {
		const $u = $j(draining_turns.v);
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
function $C(self, value, $f) {
	self[0].v = value;
	const $D = $f;
	let $E = null;
	if ($D[0] === 0) {
		const turn = $D[1];
		$E = enqueue(turn, self[1].v);
	} else {
		const $F = $j(draining_turns.v);
		let $G = null;
		if ($F[0] === 0) {
			const draining = $F[1];
			$G = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$G = undefined;
		}
		$E = $G;
	}
	return $E;
}
function $N(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(entry[0]);
	}
	return result;
}
function $O(self, key) {
	const $P = __map_get(self[0], hash(key));
	let $Q = null;
	if ($P[0] === 0) {
		const entry = $P[1];
		$Q = [ 0, entry[1] ];
	} else {
		$Q = [ 1 ];
	}
	return $Q;
}
function $T(self, key, value) {
	self[0].set(hash(key), [ key, value ]);
}
function $U(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(entry[1]);
	}
	return result;
}
function $X(self) {
	return self[0].v;
}
function $W(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($X(self));
		return;
	} ]);
	observer($X(self));
	return [ self[1], id ];
}
function $aa(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $aj(self) {
	return self[0].v;
}
function $ai(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($aj(self));
		return;
	} ]);
	observer($aj(self));
	return [ self[1], id ];
}
function $ak(self, item, $al) {
	self[0].v.push(() => {
		dispose(item, $al);
		return;
	});
	return item;
}
function $ae(self, observer, $af, $ag) {
	$ak(get_owner($ag), $ai(self, observer), $af);
}
function $ar(self, observer, $af, $ag) {
	$ak(get_owner($ag), $W(self, observer), $af);
}
function $av(self) {
	return self[0].v;
}
function $aw(self, value, $f) {
	self[0].v = value;
	const $ax = $f;
	let $ay = null;
	if ($ax[0] === 0) {
		const turn = $ax[1];
		$ay = enqueue(turn, self[1].v);
	} else {
		const $az = $j(draining_turns.v);
		let $aA = null;
		if ($az[0] === 0) {
			const draining = $az[1];
			$aA = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$aA = undefined;
		}
		$ay = $aA;
	}
	return $ay;
}
function $at(self, transform, $au) {
	const derived = $d(transform($av(self)));
	self[1].v.push([ fresh_id(), () => {
		$aw(derived, transform($av(self)), $au);
		return;
	} ]);
	return derived;
}
function $aJ(old_keys, old_items, items, key_of) {
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
				let $aK = null;
				if (eq(__at(old_items, index), item)) {
					$aK = [ 0, index ];
				} else {
					$aK = [ 1, index ];
				}
				step = $aK;
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
function $aO(owner, body) {
	return body(owner);
}
function $aS(self) {
	return self[0].v;
}
function $aR(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($aS(self));
		return;
	} ]);
	observer($aS(self));
	return [ self[1], id ];
}
function $aQ(self, observer, $af, $ag) {
	$ak(get_owner($ag), $aR(self, observer), $af);
}
function $aG(self, source, key, render, $aH, $aI) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($aI), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$aQ(source, (list) => {
		const plan = $aJ(row_keys.v, row_items.v, list, key);
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
			const $aL = step;
			let $aM = null;
			if ($aL[0] === 0) {
				const index2 = $aL[1];
				next_views.push(__at(previous_views, index2));
				next_owners.push(__at(previous_owners, index2));
				$aM = undefined;
			} else if ($aL[0] === 1) {
				const index3 = $aL[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($aO(owner, ($aN) => {
					return render(item, $aN);
				}));
				next_owners.push(owner);
				$aM = undefined;
			} else {
				const owner2 = new3();
				next_views.push($aO(owner2, ($aP) => {
					return render(item, $aP);
				}));
				next_owners.push(owner2);
				$aM = undefined;
			}
			$aM;
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
	}, $aH, $aI);
	return self;
}
function $aU(self) {
	return self[0].v;
}
function $aT(self, transform, $au) {
	const derived = $d(transform($aU(self)));
	self[1].v.push([ fresh_id(), () => {
		$aw(derived, transform($aU(self)), $au);
		return;
	} ]);
	return derived;
}
function $aZ(old_keys, old_items, items, key_of) {
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
				let $ba = null;
				if (eq2(__at(old_items, index), item)) {
					$ba = [ 0, index ];
				} else {
					$ba = [ 1, index ];
				}
				step = $ba;
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
function $aY(self, source, key, render, $aH, $aI) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($aI), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$aQ(source, (list) => {
		const plan = $aZ(row_keys.v, row_items.v, list, key);
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
			const $bb = step;
			let $bc = null;
			if ($bb[0] === 0) {
				const index2 = $bb[1];
				next_views.push(__at(previous_views, index2));
				next_owners.push(__at(previous_owners, index2));
				$bc = undefined;
			} else if ($bb[0] === 1) {
				const index3 = $bb[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($aO(owner, ($aN) => {
					return render(item, $aN);
				}));
				next_owners.push(owner);
				$bc = undefined;
			} else {
				const owner2 = new3();
				next_views.push($aO(owner2, ($aP) => {
					return render(item, $aP);
				}));
				next_owners.push(owner2);
				$bc = undefined;
			}
			$bc;
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
	}, $aH, $aI);
	return self;
}
function $be(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, scope ];
}
function $bf(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $bi(self, value, $f) {
	self[0].v = value;
	const $bj = $f;
	let $bk = null;
	if ($bj[0] === 0) {
		const turn = $bj[1];
		$bk = enqueue(turn, self[1].v);
	} else {
		const $bl = $j(draining_turns.v);
		let $bm = null;
		if ($bl[0] === 0) {
			const draining = $bl[1];
			$bm = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bm = undefined;
		}
		$bk = $bm;
	}
	return $bk;
}
function $bp(self) {
	return self[0].v;
}
function $bq(self, value, $f) {
	self[0].v = value;
	const $br = $f;
	let $bs = null;
	if ($br[0] === 0) {
		const turn = $br[1];
		$bs = enqueue(turn, self[1].v);
	} else {
		const $bt = $j(draining_turns.v);
		let $bu = null;
		if ($bt[0] === 0) {
			const draining = $bt[1];
			$bu = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bu = undefined;
		}
		$bs = $bu;
	}
	return $bs;
}
function $bn(self, transform, $bo) {
	$bq(self, transform($bp(self)), $bo);
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
	VilanPlayground.setDoc(VilanPlayground.example(name));
	$m(diagnostics, [  ], [ 1 ]);
	$r(console_lines, [  ], [ 1 ]);
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
	const $w = share_revert.v;
	let $x = null;
	if ($w[0] === 0) {
		const timer = $w[1];
		$x = cancel(timer);
	} else {
		$x = undefined;
	}
	$x;
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
	$C(diagnostics, rows, [ 1 ]);
	return rows.length;
};
mount_root("app", ($H) => {
	return playground_page(status, diagnostics, console_lines, can_format, share_label, run, format, share, [ 1 ], $H);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $bh = null;
	if (kind === "ready") {
		$aw(can_format, event.canFormat, [ 1 ]);
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
		}
		$bh = undefined;
	} else if (kind === "formatted") {
		if (event.changed) {
			$e(status, "Formatted.", [ 1 ]);
		} else {
			$e(status, "Format made no changes.", [ 1 ]);
		}
		$bh = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			$e(status, "Link copied to the clipboard.", [ 1 ]);
			flash_share("Copied!");
		} else {
			$e(status, "Link ready in the address bar.", [ 1 ]);
			flash_share("Link ready");
		}
		$bh = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		if (event.ok) {
			$e(status, "No problems (vilan " + event.version + ").", [ 1 ]);
		} else if (count === 1) {
			$e(status, "1 problem; see the diagnostics.", [ 1 ]);
		} else {
			$e(status, "" + count + " problems; see the diagnostics.", [ 1 ]);
		}
		$bh = undefined;
	} else if (kind === "result") {
		apply_diagnostics(event);
		$bi(console_lines, [  ], [ 1 ]);
		if (event.ok) {
			$e(status, "Compiled (vilan " + event.version + ")", [ 1 ]);
			VilanPlayground.runProgram(event.js, event.css);
		} else {
			$e(status, "Build failed; see the diagnostics.", [ 1 ]);
			VilanPlayground.clearProgram();
		}
		$bh = undefined;
	} else if (kind === "crash") {
		$e(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $bh;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const kind = message.kind;
	if (kind === "log" || kind === "error") {
		$bn(console_lines, (lines) => {
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
