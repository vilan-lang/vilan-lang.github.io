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
	let $N = null;
	if (is_svg_tag(tag)) {
		$N = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$N = [ document.createElement(tag) ];
	}
	return $N;
}
function is_svg_tag(tag) {
	const $L = tag;
	let $M = null;
	if ($L === "svg") {
		$M = true;
	} else if ($L === "path") {
		$M = true;
	} else if ($L === "circle") {
		$M = true;
	} else if ($L === "ellipse") {
		$M = true;
	} else if ($L === "rect") {
		$M = true;
	} else if ($L === "line") {
		$M = true;
	} else if ($L === "polyline") {
		$M = true;
	} else if ($L === "polygon") {
		$M = true;
	} else if ($L === "g") {
		$M = true;
	} else if ($L === "defs") {
		$M = true;
	} else if ($L === "use") {
		$M = true;
	} else if ($L === "symbol") {
		$M = true;
	} else if ($L === "marker") {
		$M = true;
	} else if ($L === "pattern") {
		$M = true;
	} else if ($L === "mask") {
		$M = true;
	} else if ($L === "clipPath") {
		$M = true;
	} else if ($L === "linearGradient") {
		$M = true;
	} else if ($L === "radialGradient") {
		$M = true;
	} else if ($L === "stop") {
		$M = true;
	} else if ($L === "text") {
		$M = true;
	} else if ($L === "tspan") {
		$M = true;
	} else if ($L === "textPath") {
		$M = true;
	} else if ($L === "filter") {
		$M = true;
	} else if ($L === "foreignObject") {
		$M = true;
	} else if ($L === "feGaussianBlur") {
		$M = true;
	} else if ($L === "feColorMatrix") {
		$M = true;
	} else if ($L === "feOffset") {
		$M = true;
	} else if ($L === "feMerge") {
		$M = true;
	} else if ($L === "feMergeNode") {
		$M = true;
	} else if ($L === "feFlood") {
		$M = true;
	} else if ($L === "feComposite") {
		$M = true;
	} else if ($L === "feBlend") {
		$M = true;
	} else if ($L === "feDropShadow") {
		$M = true;
	} else {
		$M = false;
	}
	return $M;
}
function text(self, content) {
	self[0].textContent = content;
	return __clone(self);
}
function styled(self, style) {
	self[0].setAttribute("class", class_list(style));
	return __clone(self);
}
function style_var(self, name, source, $ac, $ad) {
	const element = __clone(self[0]);
	$ae(source, (value) => {
		element.style.setProperty(name, value);
		return;
	}, $ac, $ad);
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
	$ae(source, (value) => {
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
	const $bK = $bJ([ 1 ], ($bH) => {
		return $bI(body);
	});
	const built = $bK[0];
	const root = $bK[1];
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
	const $U = property;
	let $V = null;
	if ($U === "padding") {
		$V = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($U === "margin") {
		$V = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($U === "inset") {
		$V = ";top;right;bottom;left;";
	} else if ($U === "flex") {
		$V = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($U === "background") {
		$V = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($U === "border") {
		$V = border_longhands();
	} else {
		$V = "";
	}
	return $V;
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
	for (const key of $O(rules)) {
		const parts = key.split(":");
		if (__at(parts, 0) === media && __at(parts, 1) === condition && longhands.includes(";" + __at(parts, 2) + ";")) {
			$W(out, key);
		}
	}
	return out;
}
function class_list(self) {
	let out = "";
	for (const entry of $Y(self[0])) {
		const $Z = entry;
		const class2 = $Z[0];
		const _declaration = $Z[1];
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
	for (const key of $O(b[0])) {
		const $S = $P(b[0], key);
		let $T = null;
		if ($S[0] === 0) {
			const entry = $S[1];
			const parts = key.split(":");
			rules = without_covered(rules, __at(parts, 0), __at(parts, 1), __at(parts, 2));
			$X(rules, key, entry);
			$T = undefined;
		} else {
			$T = undefined;
		}
		$T;
	}
	return [ __clone(rules) ];
}
function template_option(value, label, $aI, $aJ) {
	return text($ao(view("option"), "value", value, $aI, $aJ), label);
}
function template_title(name) {
	const $aO = name;
	let $aP = null;
	if ($aO === "counter") {
		$aP = "Counter";
	} else if ($aO === "hello") {
		$aP = "Hello";
	} else if ($aO === "styles") {
		$aP = "Styles";
	} else if ($aO === "server") {
		$aP = "Server";
	} else {
		$aP = name;
	}
	return $aP;
}
function severity_tag(row) {
	const $be = row[1];
	let $bf = null;
	if ($be === "error") {
		$bf = text(styled(view("span"), diag_error), "error");
	} else {
		$bf = text(styled(view("span"), diag_warning), "warning");
	}
	return $bf;
}
function diagnostic_row(row, $bc, $bd) {
	const head = $ar($ar($ar(view("div"), severity_tag(row), $bc, $bd), text(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " "), $bc, $bd), text(view("span"), row[5]), $bc, $bd);
	const $bg = row[6];
	let $bh = null;
	if ($bg === "") {
		$bh = head;
	} else {
		$bh = $ar($ar(view("div"), head, $bc, $bd), text(styled(view("div"), diag_note), "  note: " + row[6]), $bc, $bd);
	}
	const body = $bh;
	const $bi = row[1];
	let $bj = null;
	if ($bi === "error") {
		$bj = $ar(styled(view("div"), diag_row_error), body, $bc, $bd);
	} else {
		$bj = $ar(styled(view("div"), diag_row_warning), body, $bc, $bd);
	}
	return $bj;
}
function console_row(row) {
	const $bA = row[1];
	let $bB = null;
	if ($bA === "error") {
		$bB = text(styled(view("div"), console_error), row[2]);
	} else {
		$bB = text(styled(view("div"), console_line), row[2]);
	}
	return $bB;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, share_label2, mode2, modified_from2, confirm_target2, run2, format2, share2, confirm_replace2, cancel_replace2, $J, $K) {
	return $ar($ar(styled(view("div"), add(add(shell, page_fill), code_palette)), top_bar($a("1"), $J, $K), $J, $K), $ar($ar(styled(view("main"), add(wide_column, workbench)), $ar($ar($ar($ar($ar($ar($ar($ar(styled(view("div"), toolbar), text(styled(view("h1"), page_title), "Playground: vilan in the browser"), $J, $K), styled(view("div"), rail_divider), $J, $K), on(bind_text(styled(view("button"), primary_button), $aw(mode2, (current) => {
		const $au = current;
		let $av = null;
		if ($au === "node") {
			$av = "Check";
		} else {
			$av = "Run";
		}
		return $av;
	}, $J), $J, $K), "click", ($aA) => {
		return run2();
	}), $J, $K), $ar($ar(show($ao($ao(styled(view("select"), select_box), "id", "mode", $J, $K), "aria-label", "Compile mode", $J, $K), can_platform2, $J, $K), template_option("browser", "Browser: compile and run", $J, $K), $J, $K), template_option("node", "Server: check the process leg", $J, $K), $J, $K), $J, $K), show(on(text(styled(view("button"), ghost_button), "Format"), "click", ($aK) => {
		return format2();
	}), can_format2, $J, $K), $J, $K), on(bind_text(styled(view("button"), ghost_button), share_label2, $J, $K), "click", ($aL) => {
		return share2();
	}), $J, $K), bind_text($ao(styled(view("p"), status_line), "role", "status", $J, $K), status2, $J, $K), $J, $K), $ao($ao(styled(view("select"), version_select), "id", "version", $J, $K), "aria-label", "Compiler version", $J, $K), $J, $K), $J, $K), $ar($ar(styled(view("div"), panes), $ar($ar(styled(view("div"), pane), $ar($ar($ar(styled(view("div"), panel_grow), $ar($ar(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Program"), $J, $K), $ar($ar($ar($ar($ar($ao($ao(styled(view("select"), select_box), "id", "template", $J, $K), "aria-label", "Load an example", $J, $K), bind_text($ao($ao($ao(view("option"), "value", "", $J, $K), "disabled", "true", $J, $K), "hidden", "true", $J, $K), $aw(modified_from2, (name) => {
		const $aM = name;
		let $aN = null;
		if ($aM === "") {
			$aN = "Examples";
		} else {
			$aN = "Modified \u{2014} " + template_title(name);
		}
		return $aN;
	}, $J), $J, $K), $J, $K), template_option("counter", "Counter: reactive state", $J, $K), $J, $K), template_option("hello", "Hello: mount and print", $J, $K), $J, $K), template_option("styles", "Styles: compile-time CSS", $J, $K), $J, $K), show(template_option("server", "Server: typed HTTP, checked", $J, $K), can_platform2, $J, $K), $J, $K), $J, $K), $J, $K), $ar(show($ao(view("div"), "role", "alert", $J, $K), $aQ(confirm_target2, (name) => {
		return name !== "";
	}, $J), $J, $K), $ar($ar($ar(styled(view("div"), confirm_bar), bind_text(styled(view("p"), confirm_question), $aw(confirm_target2, (name) => {
		return "Replace the current program with " + template_title(name) + "? The edits are not kept.";
	}, $J), $J, $K), $J, $K), on(text(styled(view("button"), ghost_button), "Keep editing"), "click", ($aX) => {
		return cancel_replace2();
	}), $J, $K), on(text(styled(view("button"), primary_button), "Replace"), "click", ($aY) => {
		return confirm_replace2();
	}), $J, $K), $J, $K), $J, $K), $ao($ao(styled(view("div"), editor_host), "id", "editor", $J, $K), "aria-label", "Program editor", $J, $K), $J, $K), $J, $K), $ar($ar(styled(view("div"), panel_fixed), $ar(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Diagnostics"), $J, $K), $J, $K), $ar($ar(styled(view("pre"), report_well), show(text(styled(view("div"), quiet_row), "Nothing to report."), $aZ(diagnostics2, (rows) => {
		return rows.length === 0;
	}, $J), $J, $K), $J, $K), $bk(view("div"), diagnostics2, (row) => {
		return row[0];
	}, (row, $bb) => {
		return diagnostic_row(row, $J, $bb);
	}, $J, $K), $J, $K), $J, $K), $J, $K), $J, $K), $ar($ar(styled(view("div"), pane), $ar($ar(styled(view("div"), panel_grow), $ar(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Result"), $J, $K), $J, $K), $ao($ao(styled(view("div"), runner_host), "id", "runner", $J, $K), "aria-label", "Program result", $J, $K), $J, $K), $J, $K), $ar($ar(styled(view("div"), panel_fixed), $ar(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Console"), $J, $K), $J, $K), $ar($ar(styled(view("pre"), report_well), show(text(styled(view("div"), quiet_row), "Program output lands here."), $bx(console_lines2, (rows) => {
		return rows.length === 0;
	}, $J), $J, $K), $J, $K), $bC(view("div"), console_lines2, (row) => {
		return row[0];
	}, (row, $bz) => {
		return console_row(row);
	}, $J, $K), $J, $K), $J, $K), $J, $K), $J, $K), $J, $K), $J, $K);
}
function eq(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2] && self[3] === other[3] && self[4] === other[4] && self[5] === other[5] && self[6] === other[6];
}
function eq2(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2];
}
function top_bar(scroll_fade, $aa, $ab) {
	return $ar(style_var(styled(view("nav"), topbar), "--nav-fade", scroll_fade, $aa, $ab), $ar($ar(styled(view("div"), add(column, nav_row)), $ar($ar($ao(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $aa, $ab), $ao(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $aa, $ab), $aa, $ab), text(view("span"), "VILAN"), $aa, $ab), $aa, $ab), $ar($ar($ar($ar(styled(view("div"), nav_links), text($ao(styled(view("a"), nav_link), "href", "/#install", $aa, $ab), "Install"), $aa, $ab), text($ao(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html", $aa, $ab), "Learn"), $aa, $ab), text($ao(styled(view("a"), nav_link), "href", "/playground/", $aa, $ab), "Playground"), $aa, $ab), text($ao(styled(view("a"), nav_link), "href", "/docs/", $aa, $ab), "Docs"), $aa, $ab), $aa, $ab), $aa, $ab);
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
function $v(self) {
	return self[0].v;
}
function $D(self, $g) {
	const $E = $g;
	let $F = null;
	if ($E[0] === 0) {
		const turn = $E[1];
		$F = enqueue(turn, self[1].v);
	} else {
		const $G = $k(draining_turns.v);
		let $H = null;
		if ($G[0] === 0) {
			const draining = $G[1];
			$H = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$H = undefined;
		}
		$F = $H;
	}
	return $F;
}
function $C(self, value, $e) {
	self[0].v = value;
	$D(self, $e);
}
function $O(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[0]));
	}
	return result;
}
function $P(self, key) {
	const $Q = __map_get(self[0], hash(key));
	let $R = null;
	if ($Q[0] === 0) {
		const entry = $Q[1];
		$R = [ 0, __clone(entry[1]) ];
	} else {
		$R = [ 1 ];
	}
	return $R;
}
function $W(self, key) {
	self[0].delete(hash(key));
}
function $X(self, key, value) {
	self[0].set(hash(key), [ __clone(key), __clone(value) ]);
}
function $Y(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[1]));
	}
	return result;
}
function $ai(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($v(self));
		return;
	} ]);
	observer($v(self));
	return [ self[1], id ];
}
function $aj(self, item, $ak) {
	self[0].v.push(() => {
		dispose(item, $ak);
		return;
	});
	return __clone(item);
}
function $ae(self, observer, $af, $ag) {
	$aj(get_owner($ag), $ai(self, observer), $af);
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
	const derived = $a(transform($v(self)));
	self[1].v.push([ fresh_id(), () => {
		$d(derived, transform($v(self)), $ax);
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
function $aF(self, observer, $af, $ag) {
	$aj(get_owner($ag), $aG(self, observer), $af);
}
function $aS(self, $g) {
	const $aT = $g;
	let $aU = null;
	if ($aT[0] === 0) {
		const turn = $aT[1];
		$aU = enqueue(turn, self[1].v);
	} else {
		const $aV = $k(draining_turns.v);
		let $aW = null;
		if ($aV[0] === 0) {
			const draining = $aV[1];
			$aW = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$aW = undefined;
		}
		$aU = $aW;
	}
	return $aU;
}
function $aR(self, value, $e) {
	self[0].v = value;
	$aS(self, $e);
}
function $aQ(self, transform, $ax) {
	const derived = $c(transform($v(self)));
	self[1].v.push([ fresh_id(), () => {
		$aR(derived, transform($v(self)), $ax);
		return;
	} ]);
	return derived;
}
function $ba(self) {
	return self[0].v;
}
function $aZ(self, transform, $ax) {
	const derived = $c(transform($ba(self)));
	self[1].v.push([ fresh_id(), () => {
		$aR(derived, transform($ba(self)), $ax);
		return;
	} ]);
	return derived;
}
function $bn(old_keys, old_items, items, key_of) {
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
				let $bo = null;
				if (eq(__at(old_items, index), item)) {
					$bo = [ 0, index ];
				} else {
					$bo = [ 1, index ];
				}
				step = $bo;
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
function $bs(owner, body) {
	return body(owner);
}
function $bw(self) {
	return self[0].v;
}
function $bv(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($bw(self));
		return;
	} ]);
	observer($bw(self));
	return [ self[1], id ];
}
function $bu(self, observer, $af, $ag) {
	$aj(get_owner($ag), $bv(self, observer), $af);
}
function $bk(self, source, key, render, $bl, $bm) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($bm), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$bu(source, (list) => {
		const plan = $bn(row_keys.v, row_items.v, list, key);
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
			const $bp = step;
			let $bq = null;
			if ($bp[0] === 0) {
				const index2 = $bp[1];
				next_views.push(__clone(__at(previous_views, index2)));
				next_owners.push(__clone(__at(previous_owners, index2)));
				$bq = undefined;
			} else if ($bp[0] === 1) {
				const index3 = $bp[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bs(owner, ($br) => {
					return render(item, $br);
				}));
				next_owners.push(__clone(owner));
				$bq = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bs(owner2, ($bt) => {
					return render(item, $bt);
				}));
				next_owners.push(__clone(owner2));
				$bq = undefined;
			}
			$bq;
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
	}, $bl, $bm);
	return __clone(self);
}
function $by(self) {
	return self[0].v;
}
function $bx(self, transform, $ax) {
	const derived = $c(transform($by(self)));
	self[1].v.push([ fresh_id(), () => {
		$aR(derived, transform($by(self)), $ax);
		return;
	} ]);
	return derived;
}
function $bD(old_keys, old_items, items, key_of) {
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
				let $bE = null;
				if (eq2(__at(old_items, index), item)) {
					$bE = [ 0, index ];
				} else {
					$bE = [ 1, index ];
				}
				step = $bE;
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
function $bC(self, source, key, render, $bl, $bm) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($bm), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$bu(source, (list) => {
		const plan = $bD(row_keys.v, row_items.v, list, key);
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
			const $bF = step;
			let $bG = null;
			if ($bF[0] === 0) {
				const index2 = $bF[1];
				next_views.push(__clone(__at(previous_views, index2)));
				next_owners.push(__clone(__at(previous_owners, index2)));
				$bG = undefined;
			} else if ($bF[0] === 1) {
				const index3 = $bF[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bs(owner, ($br) => {
					return render(item, $br);
				}));
				next_owners.push(__clone(owner));
				$bG = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bs(owner2, ($bt) => {
					return render(item, $bt);
				}));
				next_owners.push(__clone(owner2));
				$bG = undefined;
			}
			$bG;
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
	}, $bl, $bm);
	return __clone(self);
}
function $bI(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, __clone(scope) ];
}
function $bJ(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $bR(self, $g) {
	const $bS = $g;
	let $bT = null;
	if ($bS[0] === 0) {
		const turn = $bS[1];
		$bT = enqueue(turn, self[1].v);
	} else {
		const $bU = $k(draining_turns.v);
		let $bV = null;
		if ($bU[0] === 0) {
			const draining = $bU[1];
			$bV = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bV = undefined;
		}
		$bT = $bV;
	}
	return $bT;
}
function $bQ(self, value, $e) {
	self[0].v = value;
	$bR(self, $e);
}
function $bO(self, transform, $bP) {
	$bQ(self, transform($by(self)), $bP);
}
const next_subscriber_id = __shared_new(0);
const draining_turns = __shared_new([  ]);
const wide_column = [ [ new Map([ [ "::max-width", [ "::max-width", [ "s1eewcz2", "max-width:1880px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ] ]) ] ];
const page_fill = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::min-height", [ "::min-height", [ "sw3dlhu", "min-height:100vh" ] ] ] ]) ] ];
const workbench = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxp9", "padding-top:var(--space-3)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiykh", "padding-bottom:var(--space-3)" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::width", [ "::width", [ "s178flj9", "width:100%" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ] ]) ] ];
const panes = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "1024px::flex-direction", [ "1024px::flex-direction", [ "s1a4afps", "flex-direction:row" ] ] ] ]) ] ];
const pane = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ], [ "::flex", [ "::flex", [ "s4sfhb", "flex:1 1 0" ] ] ] ]) ] ];
const panel_grow = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::border", [ "::border", [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ] ]) ] ];
const panel_fixed = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::border", [ "::border", [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ], [ "::flex", [ "::flex", [ "sr4r3mu", "flex:0 0 auto" ] ] ] ]) ] ];
const panel_head = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::min-height", [ "::min-height", [ "sonfe9c", "min-height:32px" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "sepksxk", "border-bottom:1px solid var(--stroke-soft)" ] ] ] ]) ] ];
const toolbar = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::min-height", [ "::min-height", [ "sonfe9c", "min-height:32px" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ "::border", [ "::border", [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ] ]) ] ];
const rail_divider = [ [ new Map([ [ "::width", [ "::width", [ "sgdl0ko", "width:1px" ] ] ], [ "::align-self", [ "::align-self", [ "s1h12z4", "align-self:stretch" ] ] ], [ "::background-color", [ "::background-color", [ "s1h4num7", "background-color:var(--stroke-hard)" ] ] ], [ "::margin-left", [ "::margin-left", [ "szjswwl", "margin-left:2px" ] ] ], [ "::margin-right", [ "::margin-right", [ "suw81y3", "margin-right:2px" ] ] ] ]) ] ];
const page_title = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::color", [ "::color", [ "s1miqier", "color:var(--up-bright)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const panel_title = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzfp8", "font-weight:500" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const editor_host = [ [ new Map([ [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sw4tyxs", "min-height:320px" ] ] ] ]) ] ];
const runner_host = [ [ new Map([ [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sw4tyxs", "min-height:320px" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ]) ] ];
const ghost_button = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::background-color", [ "::background-color", [ "s1wmjjx5", "background-color:transparent" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ ":hover:background-color", [ ":hover:background-color", [ "s1s7tv0o", "background-color:var(--down-hover)" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ], [ ":active:background-color", [ ":active:background-color", [ "skghblk", "background-color:var(--down-active)" ] ] ] ]) ] ];
const primary_button = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vfx", "padding-left:var(--space-3)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdpv", "padding-right:var(--space-3)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "sj84onl", "transition:filter 80ms ease" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::background-color", [ "::background-color", [ "s19dy6kf", "background-color:var(--primary)" ] ] ], [ "::color", [ "::color", [ "s30khfz", "color:var(--primary-on)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ ":hover:filter", [ ":hover:filter", [ "s15eo8y8", "filter:brightness(1.08)" ] ] ], [ ":active:filter", [ ":active:filter", [ "sdue9po", "filter:brightness(0.94)" ] ] ] ]) ] ];
const select_box = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::padding-top", [ "::padding-top", [ "s1foenn1", "padding-top:0" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1hggi4x", "padding-bottom:0" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::border", [ "::border", [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ], [ "::height", [ "::height", [ "s22xxov", "height:24px" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ ":hover:background-color", [ ":hover:background-color", [ "s3ujeas", "background-color:var(--down-bright)" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s1of7ou7", "border-color:var(--stroke-hard)" ] ] ], [ ":active:background-color", [ ":active:background-color", [ "skghblk", "background-color:var(--down-active)" ] ] ] ]) ] ];
const version_select = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::padding-top", [ "::padding-top", [ "s1foenn1", "padding-top:0" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1hggi4x", "padding-bottom:0" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::border", [ "::border", [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ], [ "::height", [ "::height", [ "s22xxov", "height:24px" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ ":hover:background-color", [ ":hover:background-color", [ "s3ujeas", "background-color:var(--down-bright)" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s1of7ou7", "border-color:var(--stroke-hard)" ] ] ], [ ":active:background-color", [ ":active:background-color", [ "skghblk", "background-color:var(--down-active)" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ]) ] ];
const status_line = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7ve3", "padding-left:var(--space-1)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdo1", "padding-right:var(--space-1)" ] ] ] ]) ] ];
const confirm_bar = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::min-height", [ "::min-height", [ "sonfe9c", "min-height:32px" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "sepksxk", "border-bottom:1px solid var(--stroke-soft)" ] ] ] ]) ] ];
const confirm_question = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ]) ] ];
const report_well = [ [ new Map([ [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8cl8", "line-height:18px" ] ] ], [ "::white-space", [ "::white-space", [ "s41qynl", "white-space:pre-wrap" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::min-height", [ "::min-height", [ "sonk3zu", "min-height:96px" ] ] ], [ "::max-height", [ "::max-height", [ "s1sw9ehx", "max-height:240px" ] ] ] ]) ] ];
const diag_row_error = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5sm0", "padding-top:3px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzuf0", "padding-bottom:3px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::border-top", [ "::border-top", [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ], [ ":first-child:border-top", [ ":first-child:border-top", [ "sq2xqkq", "border-top:1px solid transparent" ] ] ], [ "::border-left", [ "::border-left", [ "s1v5t6xm", "border-left:2px solid var(--down-danger)" ] ] ], [ "::background-color", [ "::background-color", [ "s1er9mcg", "background-color:rgb(from var(--down-danger) r g b / 0.07)" ] ] ] ]) ] ];
const diag_row_warning = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5sm0", "padding-top:3px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzuf0", "padding-bottom:3px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::border-top", [ "::border-top", [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ], [ ":first-child:border-top", [ ":first-child:border-top", [ "sq2xqkq", "border-top:1px solid transparent" ] ] ], [ "::border-left", [ "::border-left", [ "somu7p8", "border-left:2px solid var(--down-caution)" ] ] ], [ "::background-color", [ "::background-color", [ "s6ng1wh", "background-color:rgb(from var(--down-caution) r g b / 0.06)" ] ] ] ]) ] ];
const diag_error = [ [ new Map([ [ "::color", [ "::color", [ "sxurvz1", "color:var(--up-error)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ] ]) ] ];
const diag_warning = [ [ new Map([ [ "::color", [ "::color", [ "s7y076u", "color:var(--up-caution)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ] ]) ] ];
const diag_site = [ [ new Map([ [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const diag_note = [ [ new Map([ [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const console_line = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5qxi", "padding-top:1px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzsqi", "padding-bottom:1px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ]) ] ];
const console_error = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5qxi", "padding-top:1px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzsqi", "padding-bottom:1px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::color", [ "::color", [ "sxurvz1", "color:var(--up-error)" ] ] ] ]) ] ];
const quiet_row = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5sm0", "padding-top:3px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzuf0", "padding-bottom:3px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const code_palette = [ [ new Map([ [ "::--code-face", [ "::--code-face", [ "sepvury", "--code-face:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::--code-features", [ "::--code-features", [ "s1xx7ixb", "--code-features:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ], [ "::--code-size", [ "::--code-size", [ "s17tflw5", "--code-size:13px" ] ] ], [ "::--code-bg", [ "::--code-bg", [ "sr79rlz", "--code-bg:var(--down-normal)" ] ] ], [ "::--code-fg", [ "::--code-fg", [ "s19c5xn7", "--code-fg:var(--up-bright)" ] ] ], [ "::--code-dim", [ "::--code-dim", [ "s1u3ovjb", "--code-dim:var(--up-dim)" ] ] ], [ "::--code-gutter-edge", [ "::--code-gutter-edge", [ "s19k3kma", "--code-gutter-edge:var(--stroke-soft)" ] ] ], [ "::--code-active-line", [ "::--code-active-line", [ "s1fhczbb", "--code-active-line:rgb(from var(--up-bright) r g b / 0.04)" ] ] ], [ "::--code-active-gutter", [ "::--code-active-gutter", [ "s1t1pcq8", "--code-active-gutter:rgb(from var(--up-bright) r g b / 0.07)" ] ] ], [ "::--code-selection", [ "::--code-selection", [ "snky57a", "--code-selection:rgb(from var(--up-bright) r g b / 0.18)" ] ] ], [ "::--code-keyword", [ "::--code-keyword", [ "sbb9pzp", "--code-keyword:var(--primary)" ] ] ], [ "::--code-string", [ "::--code-string", [ "s18b2uzn", "--code-string:var(--accent)" ] ] ], [ "::--code-plain", [ "::--code-plain", [ "s8onzey", "--code-plain:var(--up-normal)" ] ] ], [ "::--code-callable", [ "::--code-callable", [ "s16k06qr", "--code-callable:var(--tint-callable)" ] ] ], [ "::--code-type", [ "::--code-type", [ "s1n2n3b1", "--code-type:var(--up-bright)" ] ] ], [ "::--code-comment", [ "::--code-comment", [ "s5j3euk", "--code-comment:var(--tint-comment)" ] ] ], [ "::--code-attr", [ "::--code-attr", [ "s14j98t0", "--code-attr:rgb(from var(--primary) r g b / 0.65)" ] ] ], [ "::--code-path", [ "::--code-path", [ "s7em04x", "--code-path:rgb(from var(--up-bright) r g b / 0.6)" ] ] ], [ "::--code-operator", [ "::--code-operator", [ "s8nt3s2", "--code-operator:rgb(from var(--up-bright) r g b / 0.72)" ] ] ], [ "::--code-error", [ "::--code-error", [ "s1dxptvb", "--code-error:var(--up-error)" ] ] ], [ "::--code-caution", [ "::--code-caution", [ "s1yauy2a", "--code-caution:var(--up-caution)" ] ] ] ]) ] ];
const shell = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::min-height", [ "::min-height", [ "sondrfd", "min-height:100%" ] ] ], [ "::font-family", [ "::font-family", [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayk3oa", "font-size:14px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8cl8", "line-height:18px" ] ] ] ]) ] ];
const column = [ [ new Map([ [ "::max-width", [ "::max-width", [ "s1eamei2", "max-width:1264px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vtg8d6", "padding-left:32px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t4hls", "padding-right:32px" ] ] ] ]) ] ];
const no_drag = [ [ new Map([ [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const topbar = [ [ new Map([ [ "::position", [ "::position", [ "s1onro1c", "position:sticky" ] ] ], [ "::top", [ "::top", [ "s80ttlx", "top:0" ] ] ], [ "::z-index", [ "::z-index", [ "si5ywm6", "z-index:100" ] ] ], [ "::background-color", [ "::background-color", [ "s1dq5yi8", "background-color:rgb(from var(--down-dim) r g b / calc(var(--nav-fade, 0) * 0.86))" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "sc9brgc", "border-bottom:1px solid rgb(from var(--stroke-hard) r g b / calc(var(--nav-fade, 0) * 0.9))" ] ] ], [ "::backdrop-filter", [ "::backdrop-filter", [ "shx44pg", "backdrop-filter:blur(calc(var(--nav-fade, 0) * 14px))" ] ] ] ]) ] ];
const nav_row = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ], [ "::height", [ "::height", [ "s2310lv", "height:64px" ] ] ] ]) ] ];
const nav_brand = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odkmbv", "letter-spacing:0.35em" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ] ]) ] ];
const nav_mark = [ [ new Map([ [ "::display", [ "::display", [ "sowfjmu", "display:block" ] ] ], [ "::width", [ "::width", [ "s178hbq8", "width:36px" ] ] ], [ "::height", [ "::height", [ "s22x9bm", "height:18px" ] ] ], [ "::background-color", [ "::background-color", [ "syz58y5", "background-color:var(--up-bright)" ] ] ], [ "::-webkit-mask", [ "::-webkit-mask", [ "scqkrg6", "-webkit-mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ], [ "::mask", [ "::mask", [ "s11mtiwm", "mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ] ]) ] ];
const nav_links = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::gap", [ "::gap", [ "s8myyte", "gap:var(--space-6)" ] ] ] ]) ] ];
const nav_link = [ [ new Map([ [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::transition", [ "::transition", [ "sbcnc8a", "transition:color 80ms ease" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ] ]) ] ];
const console_cap = 300;
const status = $a("Loading the compiler\u{2026}");
const diagnostics = $b([  ]);
const console_lines = $b([  ]);
const can_format = $c(false);
const can_platform = $c(false);
const mode = $a("browser");
const share_label = $a("Share");
const next_row_id = __shared_new(0);
const modified_from = $a("");
const buffer_dirty = __shared_new(false);
const confirm_target = $a("");
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
const load_example = (name) => {
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
const pick = (name) => {
	if (buffer_dirty.v) {
		$d(confirm_target, name, [ 1 ]);
	} else {
		load_example(name);
	}
	return;
};
const confirm_replace = () => {
	const name = $v(confirm_target);
	$d(confirm_target, "", [ 1 ]);
	if (name !== "") {
		load_example(name);
	}
	return;
};
const cancel_replace = () => {
	return $d(confirm_target, "", [ 1 ]);
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
	$C(diagnostics, rows, [ 1 ]);
	return rows.length;
};
mount_root("app", ($I) => {
	return playground_page(status, diagnostics, console_lines, can_format, can_platform, share_label, mode, modified_from, confirm_target, run, format, share, confirm_replace, cancel_replace, [ 1 ], $I);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $bL = null;
	if (kind === "ready") {
		$aR(can_format, event.canFormat, [ 1 ]);
		$aR(can_platform, event.canPlatform, [ 1 ]);
		if (!(event.canPlatform)) {
			VilanPlayground.setMode("browser");
		}
		$d(status, "Ready (vilan " + event.version + ")", [ 1 ]);
		compiler_ready.v = true;
		run_on_arrival();
	} else if (kind === "doc") {
		doc_ready.v = true;
		run_on_arrival();
	} else if (kind === "dirty") {
		buffer_dirty.v = event.changed;
		$d(modified_from, event.name, [ 1 ]);
		if (!(event.changed)) {
			$d(confirm_target, "", [ 1 ]);
		}
		$bL = undefined;
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
		$bL = undefined;
	} else if (kind === "formatted") {
		if (event.changed) {
			$d(status, "Formatted.", [ 1 ]);
		} else {
			$d(status, "Format made no changes.", [ 1 ]);
		}
		$bL = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			$d(status, "Link copied to the clipboard.", [ 1 ]);
			flash_share("Copied!");
		} else {
			$d(status, "Link ready in the address bar.", [ 1 ]);
			flash_share("Link ready");
		}
		$bL = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $bM = null;
		if (event.ok) {
			if (event.platform === "node") {
				$d(status, "No problems (server check, vilan " + event.version + ").", [ 1 ]);
			} else {
				$d(status, "No problems (vilan " + event.version + ").", [ 1 ]);
			}
			$bM = undefined;
		} else if (count === 1) {
			$d(status, "1 problem; see the diagnostics.", [ 1 ]);
		} else {
			$d(status, "" + count + " problems; see the diagnostics.", [ 1 ]);
		}
		$bL = $bM;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $bN = null;
		if (event.platform === "node") {
			if (event.ok) {
				$d(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ]);
			} else {
				$d(status, "Build failed; see the diagnostics.", [ 1 ]);
			}
			$bN = undefined;
		} else {
			$p(console_lines, [  ], [ 1 ]);
			if (event.ok) {
				$d(status, "Compiled (vilan " + event.version + ")", [ 1 ]);
				VilanPlayground.runProgram(event.js, event.css);
			} else {
				$d(status, "Build failed; see the diagnostics.", [ 1 ]);
				VilanPlayground.clearProgram();
			}
			$bN = undefined;
		}
		$bL = $bN;
	} else if (kind === "crash") {
		$d(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $bL;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const kind = message.kind;
	if (kind === "log" || kind === "error") {
		$bO(console_lines, (lines) => {
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
