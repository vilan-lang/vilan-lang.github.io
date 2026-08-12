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
function __is_null(value) {
	return value === null || value === undefined;
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
		while (!($j(turn[0].v)) && budget > 0) {
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
function dispose(self, $al) {
	let kept = [  ];
	for (const subscriber of self[0].v) {
		if (subscriber[0] !== self[1]) {
			kept.push(__clone(subscriber));
		}
	}
	self[0].v = kept;
	const $am = $al;
	let $an = null;
	if ($am[0] === 0) {
		const turn = $am[1];
		let kept_pending = [  ];
		for (const subscriber2 of turn[0].v) {
			if (subscriber2[0] !== self[1]) {
				kept_pending.push(__clone(subscriber2));
			}
		}
		turn[0].v = kept_pending;
		$an = undefined;
	} else {
		$an = undefined;
	}
	return $an;
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
function get_owner($ag) {
	return $ag;
}
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $x) {
	return await (self[0].wait(ambient_signal($x)));
}
function cancel(self) {
	self[0].cancel();
}
function ambient_signal($y) {
	const $z = $y;
	let $A = null;
	if ($z[0] === 0) {
		const n = $z[1];
		$A = [ 0, n.signal_of() ];
	} else {
		$A = [ 1 ];
	}
	return $A;
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
	return __clone(self);
}
function styled(self, style) {
	self[0].setAttribute("class", class_list(style));
	return __clone(self);
}
function style_var(self, name, source, $ab, $ac) {
	const element = __clone(self[0]);
	$ad(source, (value) => {
		element.style.setProperty(name, value);
		return;
	}, $ab, $ac);
	return __clone(self);
}
function on(self, event, handler) {
	self[0].addEventListener(event, () => {
		return $aC([ 1 ], ($aB) => {
			return handler($aB);
		});
	});
	return __clone(self);
}
function bind_text(self, source, $ay, $az) {
	const element = __clone(self[0]);
	$ad(source, (value) => {
		element.textContent = value;
		return;
	}, $ay, $az);
	return __clone(self);
}
function show(self, condition, $aD, $aE) {
	const element = __clone(self[0]);
	$aF(condition, (visible) => {
		element.hidden = !(visible);
		return;
	}, $aD, $aE);
	return __clone(self);
}
function place(self, parent) {
	parent[0].appendChild(self[0]);
}
function apply(self, parent, name) {
	parent[0].setAttribute(name, self);
}
function mount_target(id) {
	const element = document.getElementById(id);
	if (__is_null(element)) {
		(() => {
			throw "mount: no element with id \'" + id + "\'";
		})();
	}
	return element;
}
function mount(id, view2) {
	const element = mount_target(id);
	element.replaceChildren();
	element.appendChild(view2[0]);
}
function mount_root(id, body) {
	const $bB = $bA([ 1 ], ($by) => {
		return $bz(body);
	});
	const built = $bB[0];
	const root = $bB[1];
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
function family_longhands(property) {
	const $T = property;
	let $U = null;
	if ($T === "padding") {
		$U = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($T === "margin") {
		$U = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($T === "inset") {
		$U = ";top;right;bottom;left;";
	} else if ($T === "flex") {
		$U = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($T === "background") {
		$U = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($T === "border") {
		$U = border_longhands();
	} else {
		$U = "";
	}
	return $U;
}
function border_longhands() {
	let out = ";border-width;border-style;border-color;";
	for (const edge of [ "top", "right", "bottom", "left" ]) {
		out = out + ("border-" + edge + ";");
		for (const part of [ "width", "style", "color" ]) {
			out = out + ("border-" + edge + "-" + part + ";");
		}
	}
	return out;
}
function without_covered(rules, media, condition, property) {
	const longhands = family_longhands(property);
	if (longhands === "") {
		return __clone(rules);
	}
	let out = __clone(rules);
	for (const key of $N(rules)) {
		const parts = key.split(":");
		if (__at(parts, 0) === media && __at(parts, 1) === condition && longhands.includes(";" + __at(parts, 2) + ";")) {
			$V(out, key);
		}
	}
	return out;
}
function class_list(self) {
	let out = "";
	for (const entry of $X(self[0])) {
		const $Y = entry;
		const class2 = $Y[0];
		const _declaration = $Y[1];
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
			const parts = key.split(":");
			rules = without_covered(rules, __at(parts, 0), __at(parts, 1), __at(parts, 2));
			$W(rules, key, entry);
			$S = undefined;
		} else {
			$S = undefined;
		}
		$S;
	}
	return [ __clone(rules) ];
}
function template_option(value, label, $aI, $aJ) {
	return text($ao(view("option"), "value", value, $aI, $aJ), label);
}
function severity_tag(row) {
	const $aX = row[1];
	let $aY = null;
	if ($aX === "error") {
		$aY = text(styled(view("span"), diag_error), "error");
	} else {
		$aY = text(styled(view("span"), diag_warning), "warning");
	}
	return $aY;
}
function diagnostic_row(row, $aV, $aW) {
	const head = $ar($ar($ar(view("div"), severity_tag(row), $aV, $aW), text(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " "), $aV, $aW), text(view("span"), row[5]), $aV, $aW);
	const $aZ = row[6];
	let $ba = null;
	if ($aZ === "") {
		$ba = head;
	} else {
		$ba = $ar($ar(view("div"), head, $aV, $aW), text(styled(view("div"), diag_note), "  note: " + row[6]), $aV, $aW);
	}
	return $ba;
}
function console_row(row) {
	const $br = row[1];
	let $bs = null;
	if ($br === "error") {
		$bs = text(styled(view("div"), console_error), row[2]);
	} else {
		$bs = text(view("div"), row[2]);
	}
	return $bs;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, share_label2, mode2, run2, format2, share2, $I, $J) {
	return $ar($ar(styled(view("div"), add(shell, page_fill)), top_bar($a("1"), $I, $J), $I, $J), $ar($ar($ar(styled(view("main"), add(wide_column, workbench)), text(styled(view("h1"), pane_label), "Playground: vilan in the browser"), $I, $J), $ar($ar($ar($ar($ar($ar(styled(view("div"), controls), on(bind_text(styled(view("button"), run_button), $aw(mode2, (current) => {
		const $au = current;
		let $av = null;
		if ($au === "node") {
			$av = "Check";
		} else {
			$av = "Run";
		}
		return $av;
	}, $I), $I, $J), "click", ($aA) => {
		return run2();
	}), $I, $J), $ar($ar(show($ao($ao(styled(view("select"), template_select), "id", "mode", $I, $J), "aria-label", "Compile mode", $I, $J), can_platform2, $I, $J), template_option("browser", "Browser: compile and run", $I, $J), $I, $J), template_option("node", "Server: check the process leg", $I, $J), $I, $J), $I, $J), show(on(text(styled(view("button"), example_button), "Format"), "click", ($aK) => {
		return format2();
	}), can_format2, $I, $J), $I, $J), on(bind_text(styled(view("button"), example_button), share_label2, $I, $J), "click", ($aL) => {
		return share2();
	}), $I, $J), bind_text($ao(styled(view("p"), status_line), "role", "status", $I, $J), status2, $I, $J), $I, $J), $ao($ao(styled(view("select"), template_select), "id", "version", $I, $J), "aria-label", "Compiler version", $I, $J), $I, $J), $I, $J), $ar($ar(styled(view("div"), panes), $ar($ar($ar($ar(styled(view("div"), pane), $ar($ar(styled(view("div"), pane_head), text(styled(view("p"), pane_label), "Program"), $I, $J), $ar($ar($ar($ar($ar($ao($ao(styled(view("select"), template_select), "id", "template", $I, $J), "aria-label", "Load an example", $I, $J), text($ao($ao($ao(view("option"), "value", "", $I, $J), "disabled", "true", $I, $J), "hidden", "true", $I, $J), "Examples"), $I, $J), template_option("counter", "Counter: reactive state", $I, $J), $I, $J), template_option("hello", "Hello: mount and print", $I, $J), $I, $J), template_option("styles", "Styles: compile-time CSS", $I, $J), $I, $J), show(template_option("server", "Server: typed HTTP, checked", $I, $J), can_platform2, $I, $J), $I, $J), $I, $J), $I, $J), $ao($ao(styled(view("div"), editor_host), "id", "editor", $I, $J), "aria-label", "Program editor", $I, $J), $I, $J), text(styled(view("p"), pane_label), "Diagnostics"), $I, $J), $ar($ar(styled(view("pre"), report_pre), show(text(styled(view("div"), quiet_row), "Nothing to report."), $aM(diagnostics2, (rows) => {
		return rows.length === 0;
	}, $I), $I, $J), $I, $J), $bb(view("div"), diagnostics2, (row) => {
		return row[0];
	}, (row, $aU) => {
		return diagnostic_row(row, $I, $aU);
	}, $I, $J), $I, $J), $I, $J), $I, $J), $ar($ar($ar($ar(styled(view("div"), pane), text(styled(view("p"), pane_label), "Result"), $I, $J), $ao($ao(styled(view("div"), runner_host), "id", "runner", $I, $J), "aria-label", "Program result", $I, $J), $I, $J), text(styled(view("p"), pane_label), "Console"), $I, $J), $ar($ar(styled(view("pre"), report_pre), show(text(styled(view("div"), quiet_row), "Program output lands here."), $bo(console_lines2, (rows) => {
		return rows.length === 0;
	}, $I), $I, $J), $I, $J), $bt(view("div"), console_lines2, (row) => {
		return row[0];
	}, (row, $bq) => {
		return console_row(row);
	}, $I, $J), $I, $J), $I, $J), $I, $J), $I, $J), $I, $J);
}
function eq(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2] && self[3] === other[3] && self[4] === other[4] && self[5] === other[5] && self[6] === other[6];
}
function eq2(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2];
}
function top_bar(scroll_fade, $Z, $aa) {
	return $ar(style_var(styled(view("nav"), topbar), "--nav-fade", scroll_fade, $Z, $aa), $ar($ar(styled(view("div"), add(column, nav_row)), $ar($ar($ao(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $Z, $aa), $ao($ao($ao(styled(view("img"), no_drag), "src", "" + assets + "/mark.svg", $Z, $aa), "alt", "", $Z, $aa), "height", "18", $Z, $aa), $Z, $aa), text(view("span"), "VILAN"), $Z, $aa), $Z, $aa), $ar($ar($ar(styled(view("div"), nav_links), text($ao(styled(view("a"), nav_link), "href", "#install", $Z, $aa), "Install"), $Z, $aa), text($ao(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html", $Z, $aa), "Learn"), $Z, $aa), text($ao(styled(view("a"), nav_link), "href", "/docs/", $Z, $aa), "Docs"), $Z, $aa), $Z, $aa), $Z, $aa);
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
function $j(self) {
	return self.length === 0;
}
function $k(self) {
	return __list_get(self, self.length - 1);
}
function $f(self, $g) {
	const $h = $g;
	let $i = null;
	if ($h[0] === 0) {
		const turn = $h[1];
		$i = enqueue(turn, self[1].v);
	} else {
		const $l = $k(draining_turns.v);
		let $m = null;
		if ($l[0] === 0) {
			const draining = $l[1];
			$m = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$m = undefined;
		}
		$i = $m;
	}
	return $i;
}
function $d(self, value, $e) {
	self[0].v = value;
	$f(self, $e);
}
function $q(self, $g) {
	const $r = $g;
	let $s = null;
	if ($r[0] === 0) {
		const turn = $r[1];
		$s = enqueue(turn, self[1].v);
	} else {
		const $t = $k(draining_turns.v);
		let $u = null;
		if ($t[0] === 0) {
			const draining = $t[1];
			$u = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$u = undefined;
		}
		$s = $u;
	}
	return $s;
}
function $p(self, value, $e) {
	self[0].v = value;
	$q(self, $e);
}
function $C(self, $g) {
	const $D = $g;
	let $E = null;
	if ($D[0] === 0) {
		const turn = $D[1];
		$E = enqueue(turn, self[1].v);
	} else {
		const $F = $k(draining_turns.v);
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
function $B(self, value, $e) {
	self[0].v = value;
	$C(self, $e);
}
function $N(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[0]));
	}
	return result;
}
function $O(self, key) {
	const $P = __map_get(self[0], hash(key));
	let $Q = null;
	if ($P[0] === 0) {
		const entry = $P[1];
		$Q = [ 0, __clone(entry[1]) ];
	} else {
		$Q = [ 1 ];
	}
	return $Q;
}
function $V(self, key) {
	self[0].delete(hash(key));
}
function $W(self, key, value) {
	self[0].set(hash(key), [ __clone(key), __clone(value) ]);
}
function $X(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[1]));
	}
	return result;
}
function $ai(self) {
	return self[0].v;
}
function $ah(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($ai(self));
		return;
	} ]);
	observer($ai(self));
	return [ self[1], id ];
}
function $aj(self, item, $ak) {
	self[0].v.push(() => {
		dispose(item, $ak);
		return;
	});
	return __clone(item);
}
function $ad(self, observer, $ae, $af) {
	$aj(get_owner($af), $ah(self, observer), $ae);
}
function $ao(self, name, value, $ap, $aq) {
	apply(value, self, name, $ap, $aq);
	return __clone(self);
}
function $ar(self, content, $as, $at) {
	place(content, self, $as, $at);
	return __clone(self);
}
function $aw(self, transform, $ax) {
	const derived = $a(transform($ai(self)));
	self[1].v.push([ fresh_id(), () => {
		$d(derived, transform($ai(self)), $ax);
		return;
	} ]);
	return derived;
}
function $aC(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $aH(self) {
	return self[0].v;
}
function $aG(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($aH(self));
		return;
	} ]);
	observer($aH(self));
	return [ self[1], id ];
}
function $aF(self, observer, $ae, $af) {
	$aj(get_owner($af), $aG(self, observer), $ae);
}
function $aN(self) {
	return self[0].v;
}
function $aP(self, $g) {
	const $aQ = $g;
	let $aR = null;
	if ($aQ[0] === 0) {
		const turn = $aQ[1];
		$aR = enqueue(turn, self[1].v);
	} else {
		const $aS = $k(draining_turns.v);
		let $aT = null;
		if ($aS[0] === 0) {
			const draining = $aS[1];
			$aT = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$aT = undefined;
		}
		$aR = $aT;
	}
	return $aR;
}
function $aO(self, value, $e) {
	self[0].v = value;
	$aP(self, $e);
}
function $aM(self, transform, $ax) {
	const derived = $c(transform($aN(self)));
	self[1].v.push([ fresh_id(), () => {
		$aO(derived, transform($aN(self)), $ax);
		return;
	} ]);
	return derived;
}
function $be(old_keys, old_items, items, key_of) {
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
				let $bf = null;
				if (eq(__at(old_items, index), item)) {
					$bf = [ 0, index ];
				} else {
					$bf = [ 1, index ];
				}
				step = $bf;
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
function $bj(owner, body) {
	return body(owner);
}
function $bn(self) {
	return self[0].v;
}
function $bm(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($bn(self));
		return;
	} ]);
	observer($bn(self));
	return [ self[1], id ];
}
function $bl(self, observer, $ae, $af) {
	$aj(get_owner($af), $bm(self, observer), $ae);
}
function $bb(self, source, key, render, $bc, $bd) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($bd), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$bl(source, (list) => {
		const plan = $be(row_keys.v, row_items.v, list, key);
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
			const $bg = step;
			let $bh = null;
			if ($bg[0] === 0) {
				const index2 = $bg[1];
				next_views.push(__clone(__at(previous_views, index2)));
				next_owners.push(__clone(__at(previous_owners, index2)));
				$bh = undefined;
			} else if ($bg[0] === 1) {
				const index3 = $bg[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bj(owner, ($bi) => {
					return render(item, $bi);
				}));
				next_owners.push(__clone(owner));
				$bh = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bj(owner2, ($bk) => {
					return render(item, $bk);
				}));
				next_owners.push(__clone(owner2));
				$bh = undefined;
			}
			$bh;
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
	}, $bc, $bd);
	return __clone(self);
}
function $bp(self) {
	return self[0].v;
}
function $bo(self, transform, $ax) {
	const derived = $c(transform($bp(self)));
	self[1].v.push([ fresh_id(), () => {
		$aO(derived, transform($bp(self)), $ax);
		return;
	} ]);
	return derived;
}
function $bu(old_keys, old_items, items, key_of) {
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
				let $bv = null;
				if (eq2(__at(old_items, index), item)) {
					$bv = [ 0, index ];
				} else {
					$bv = [ 1, index ];
				}
				step = $bv;
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
function $bt(self, source, key, render, $bc, $bd) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($bd), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$bl(source, (list) => {
		const plan = $bu(row_keys.v, row_items.v, list, key);
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
			const $bw = step;
			let $bx = null;
			if ($bw[0] === 0) {
				const index2 = $bw[1];
				next_views.push(__clone(__at(previous_views, index2)));
				next_owners.push(__clone(__at(previous_owners, index2)));
				$bx = undefined;
			} else if ($bw[0] === 1) {
				const index3 = $bw[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bj(owner, ($bi) => {
					return render(item, $bi);
				}));
				next_owners.push(__clone(owner));
				$bx = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bj(owner2, ($bk) => {
					return render(item, $bk);
				}));
				next_owners.push(__clone(owner2));
				$bx = undefined;
			}
			$bx;
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
	}, $bc, $bd);
	return __clone(self);
}
function $bz(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, __clone(scope) ];
}
function $bA(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $bI(self, $g) {
	const $bJ = $g;
	let $bK = null;
	if ($bJ[0] === 0) {
		const turn = $bJ[1];
		$bK = enqueue(turn, self[1].v);
	} else {
		const $bL = $k(draining_turns.v);
		let $bM = null;
		if ($bL[0] === 0) {
			const draining = $bL[1];
			$bM = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bM = undefined;
		}
		$bK = $bM;
	}
	return $bK;
}
function $bH(self, value, $e) {
	self[0].v = value;
	$bI(self, $e);
}
function $bF(self, transform, $bG) {
	$bH(self, transform($bp(self)), $bG);
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
const run_button = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1qm4s0m", "background-color:#EB682E" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9ro", "border-radius:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5wt9", "padding-top:8px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzym9", "padding-bottom:8px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vtfeyf", "padding-left:20px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t3o71", "padding-right:20px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::font-size", [ "::font-size", [ "sayk3oa", "font-size:14px" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "szyotuk", "opacity:0.9" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const example_button = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9ro", "border-radius:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5vz0", "padding-top:7px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzxs0", "padding-bottom:7px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vteql6", "padding-left:14px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t2zts", "padding-right:14px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "srapg3a", "opacity:1" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const status_line = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4eu", "opacity:0.7" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ] ]) ] ];
const pane_head = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ] ]) ] ];
const template_select = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9ro", "border-radius:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5v4r", "padding-top:6px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzwxr", "padding-bottom:6px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vten86", "padding-left:10px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t2wgs", "padding-right:10px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "srapg3a", "opacity:1" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
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
const console_lines = $b([  ]);
const can_format = $c(false);
const can_platform = $c(false);
const mode = $a("browser");
const share_label = $a("Share");
const next_row_id = __shared_new(0);
const run = () => {
	if (VilanPlayground.compile(VilanPlayground.value())) {
		$d(status, "Compiling\u{2026}", [ 1 ]);
	} else {
		$d(status, "Compiler busy; queued.", [ 1 ]);
	}
	return;
};
const format = () => {
	if (!(VilanPlayground.format())) {
		$d(status, "Compiler busy; try again.", [ 1 ]);
	}
	return;
};
const share = () => {
	return VilanPlayground.share();
};
const pick = (name) => {
	const $n = name;
	let $o = null;
	if ($n === "server") {
		$o = "node";
	} else {
		$o = "browser";
	}
	const platform = $o;
	VilanPlayground.setMode(platform);
	VilanPlayground.setDoc(VilanPlayground.example(name));
	$p(diagnostics, [  ], [ 1 ]);
	$p(console_lines, [  ], [ 1 ]);
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
	$d(share_label, label, [ 1 ]);
	const $v = share_revert.v;
	let $w = null;
	if ($v[0] === 0) {
		const timer = $v[1];
		$w = cancel(timer);
	} else {
		$w = undefined;
	}
	$w;
	const timer2 = after(1600);
	share_revert.v = [ 0, __clone(timer2) ];
	__task(async () => {
		if (await (wait(timer2, [ 1 ]))) {
			$d(share_label, "Share", [ 1 ]);
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
	$B(diagnostics, rows, [ 1 ]);
	return rows.length;
};
mount_root("app", ($H) => {
	return playground_page(status, diagnostics, console_lines, can_format, can_platform, share_label, mode, run, format, share, [ 1 ], $H);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $bC = null;
	if (kind === "ready") {
		$aO(can_format, event.canFormat, [ 1 ]);
		$aO(can_platform, event.canPlatform, [ 1 ]);
		if (!(event.canPlatform)) {
			VilanPlayground.setMode("browser");
		}
		$d(status, "Ready (vilan " + event.version + ")", [ 1 ]);
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
			$d(mode, event.name, [ 1 ]);
		}
		$bC = undefined;
	} else if (kind === "formatted") {
		if (event.changed) {
			$d(status, "Formatted.", [ 1 ]);
		} else {
			$d(status, "Format made no changes.", [ 1 ]);
		}
		$bC = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			$d(status, "Link copied to the clipboard.", [ 1 ]);
			flash_share("Copied!");
		} else {
			$d(status, "Link ready in the address bar.", [ 1 ]);
			flash_share("Link ready");
		}
		$bC = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $bD = null;
		if (event.ok) {
			if (event.platform === "node") {
				$d(status, "No problems (server check, vilan " + event.version + ").", [ 1 ]);
			} else {
				$d(status, "No problems (vilan " + event.version + ").", [ 1 ]);
			}
			$bD = undefined;
		} else if (count === 1) {
			$d(status, "1 problem; see the diagnostics.", [ 1 ]);
		} else {
			$d(status, "" + count + " problems; see the diagnostics.", [ 1 ]);
		}
		$bC = $bD;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $bE = null;
		if (event.platform === "node") {
			if (event.ok) {
				$d(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ]);
			} else {
				$d(status, "Build failed; see the diagnostics.", [ 1 ]);
			}
			$bE = undefined;
		} else {
			$p(console_lines, [  ], [ 1 ]);
			if (event.ok) {
				$d(status, "Compiled (vilan " + event.version + ")", [ 1 ]);
				VilanPlayground.runProgram(event.js, event.css);
			} else {
				$d(status, "Build failed; see the diagnostics.", [ 1 ]);
				VilanPlayground.clearProgram();
			}
			$bE = undefined;
		}
		$bC = $bE;
	} else if (kind === "crash") {
		$d(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $bC;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const kind = message.kind;
	if (kind === "log" || kind === "error") {
		$bF(console_lines, (lines) => {
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
