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
function dispose(self, $at) {
	let kept = [  ];
	for (const subscriber of self[0].v) {
		if (subscriber[0] !== self[1]) {
			kept.push(__clone(subscriber));
		}
	}
	self[0].v = kept;
	const $au = $at;
	let $av = null;
	if ($au[0] === 0) {
		const turn = $au[1];
		let kept_pending = [  ];
		for (const subscriber2 of turn[0].v) {
			if (subscriber2[0] !== self[1]) {
				kept_pending.push(__clone(subscriber2));
			}
		}
		turn[0].v = kept_pending;
		$av = undefined;
	} else {
		$av = undefined;
	}
	$av;
	const $aw = self[2].v;
	let $ax = null;
	if ($aw[0] === 0) {
		const release = $aw[1];
		self[2].v = [ 1 ];
		release();
		$ax = undefined;
	} else {
		$ax = undefined;
	}
	return $ax;
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
function get_owner($ap) {
	return $ap;
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
function on(self, event, handler) {
	self[0].addEventListener(event, () => {
		return $aA([ 1 ], ($az) => {
			return handler($az);
		});
	});
	return __clone(self);
}
function children(self, items) {
	for (const item of items) {
		self[0].appendChild(item[0]);
	}
	return __clone(self);
}
function bind_text(self, source, $ak, $al) {
	const element = __clone(self[0]);
	$am(source, (value) => {
		element.textContent = value;
		return;
	}, $ak, $al);
	return __clone(self);
}
function show(self, condition, $aB, $aC) {
	const element = __clone(self[0]);
	$aD(condition, (visible) => {
		element.hidden = !(visible);
		return;
	}, $aB, $aC);
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
	const $bI = $bH([ 1 ], ($bF) => {
		return $bG(body);
	});
	const built = $bI[0];
	const root = $bI[1];
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
function template_option(value, label, $aG, $aH) {
	return text($aa(view("option"), "value", value, $aG, $aH), label);
}
function template_title(name) {
	const $aM = name;
	let $aN = null;
	if ($aM === "counter") {
		$aN = "Counter";
	} else if ($aM === "hello") {
		$aN = "Hello";
	} else if ($aM === "styles") {
		$aN = "Styles";
	} else if ($aM === "server") {
		$aN = "Server";
	} else {
		$aN = name;
	}
	return $aN;
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
function trace_row(hop) {
	let $be = null;
	if (hop[4]) {
		$be = "  via " + hop[0] + ":" + hop[1] + ":" + hop[2] + " \u{2014} " + hop[3];
	} else {
		$be = "  " + hop[3];
	}
	const text2 = $be;
	return text(styled(view("div"), diag_trace), text2);
}
function diagnostic_row(row, $ba, $bb) {
	const head = $ad($ad($ad(view("div"), severity_tag(row), $ba, $bb), text(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " "), $ba, $bb), text(view("span"), row[5]), $ba, $bb);
	let lines = [ head ];
	for (const hop of row[7]) {
		lines.push(trace_row(hop));
	}
	if (row[6] !== "") {
		lines.push(text(styled(view("div"), diag_note), "  note: " + row[6]));
	}
	const body = children(view("div"), lines);
	const $bf = row[1];
	let $bg = null;
	if ($bf === "error") {
		$bg = $ad(styled(view("div"), diag_row_error), body, $ba, $bb);
	} else {
		$bg = $ad(styled(view("div"), diag_row_warning), body, $ba, $bb);
	}
	return $bg;
}
function console_row(row) {
	const $by = row[1];
	let $bz = null;
	if ($by === "error") {
		$bz = text(styled(view("div"), console_error), row[2]);
	} else {
		$bz = text(styled(view("div"), console_line), row[2]);
	}
	return $bz;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, share_label2, mode2, modified_from2, confirm_target2, run2, format2, share2, confirm_replace2, cancel_replace2, $J, $K) {
	return $ad($ad(styled(view("div"), add(add(shell, app_fill), code_palette)), $ad($ad($ad($ad($ad($ad($ad($ad($ad($ad($ad(styled(view("header"), app_bar), $ad($ad($aa(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $J, $K), $aa(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $J, $K), $J, $K), text(view("span"), "VILAN"), $J, $K), $J, $K), text(styled(view("h1"), page_title), "Playground"), $J, $K), styled(view("div"), rail_divider), $J, $K), on(bind_text(styled(view("button"), primary_button), $ai(mode2, (current) => {
		const $ag = current;
		let $ah = null;
		if ($ag === "node") {
			$ah = "Check";
		} else {
			$ah = "Run";
		}
		return $ah;
	}, $J), $J, $K), "click", ($ay) => {
		return run2();
	}), $J, $K), $ad($ad(show($aa($aa(styled(view("select"), select_box), "id", "mode", $J, $K), "aria-label", "Compile mode", $J, $K), can_platform2, $J, $K), template_option("browser", "Browser: compile and run", $J, $K), $J, $K), template_option("node", "Server: check the process leg", $J, $K), $J, $K), $J, $K), show(on(text(styled(view("button"), ghost_button), "Format"), "click", ($aI) => {
		return format2();
	}), can_format2, $J, $K), $J, $K), on(bind_text(styled(view("button"), ghost_button), share_label2, $J, $K), "click", ($aJ) => {
		return share2();
	}), $J, $K), bind_text($aa(styled(view("p"), status_line), "role", "status", $J, $K), status2, $J, $K), $J, $K), $aa($aa(styled(view("select"), version_select), "id", "version", $J, $K), "aria-label", "Compiler version", $J, $K), $J, $K), styled(view("div"), rail_divider), $J, $K), text($aa(styled(view("a"), nav_link), "href", "/docs/", $J, $K), "Docs"), $J, $K), $J, $K), $ad($ad($ad($ad(styled(view("main"), quad_grid), $ad($ad($ad(styled(view("div"), panel), $ad($ad(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Program"), $J, $K), $ad($ad($ad($ad($ad($aa($aa(styled(view("select"), select_box), "id", "template", $J, $K), "aria-label", "Load an example", $J, $K), bind_text($aa($aa($aa(view("option"), "value", "", $J, $K), "disabled", "true", $J, $K), "hidden", "true", $J, $K), $ai(modified_from2, (name) => {
		const $aK = name;
		let $aL = null;
		if ($aK === "") {
			$aL = "Examples";
		} else {
			$aL = "Modified \u{2014} " + template_title(name);
		}
		return $aL;
	}, $J), $J, $K), $J, $K), template_option("counter", "Counter: reactive state", $J, $K), $J, $K), template_option("hello", "Hello: mount and print", $J, $K), $J, $K), template_option("styles", "Styles: compile-time CSS", $J, $K), $J, $K), show(template_option("server", "Server: typed HTTP, checked", $J, $K), can_platform2, $J, $K), $J, $K), $J, $K), $J, $K), $ad(show($aa(view("div"), "role", "alert", $J, $K), $aO(confirm_target2, (name) => {
		return name !== "";
	}, $J), $J, $K), $ad($ad($ad(styled(view("div"), confirm_bar), bind_text(styled(view("p"), confirm_question), $ai(confirm_target2, (name) => {
		return "Replace the current program with " + template_title(name) + "? The edits are not kept.";
	}, $J), $J, $K), $J, $K), on(text(styled(view("button"), ghost_button), "Keep editing"), "click", ($aV) => {
		return cancel_replace2();
	}), $J, $K), on(text(styled(view("button"), primary_button), "Replace"), "click", ($aW) => {
		return confirm_replace2();
	}), $J, $K), $J, $K), $J, $K), $aa($aa(styled(view("div"), editor_host), "id", "editor", $J, $K), "aria-label", "Program editor", $J, $K), $J, $K), $J, $K), $ad($ad(styled(view("div"), panel), $ad(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Result"), $J, $K), $J, $K), $aa($aa(styled(view("div"), runner_host), "id", "runner", $J, $K), "aria-label", "Program result", $J, $K), $J, $K), $J, $K), $ad($ad(styled(view("div"), panel), $ad(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Diagnostics"), $J, $K), $J, $K), $ad($ad(styled(view("pre"), report_well), show(text(styled(view("div"), quiet_row), "Nothing to report."), $aX(diagnostics2, (rows) => {
		return rows.length === 0;
	}, $J), $J, $K), $J, $K), $bh(view("div"), diagnostics2, (row) => {
		return row[0];
	}, (row, $aZ) => {
		return diagnostic_row(row, $J, $aZ);
	}, $J, $K), $J, $K), $J, $K), $J, $K), $ad($ad(styled(view("div"), panel), $ad(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Console"), $J, $K), $J, $K), $ad($ad(styled(view("pre"), report_well), show(text(styled(view("div"), quiet_row), "Program output lands here."), $bv(console_lines2, (rows) => {
		return rows.length === 0;
	}, $J), $J, $K), $J, $K), $bA(view("div"), console_lines2, (row) => {
		return row[0];
	}, (row, $bx) => {
		return console_row(row);
	}, $J, $K), $J, $K), $J, $K), $J, $K), $J, $K);
}
function eq(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2] && self[3] === other[3] && self[4] === other[4] && self[5] === other[5] && self[6] === other[6] && $bl(self[7], other[7]);
}
function eq2(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2] && self[3] === other[3] && self[4] === other[4];
}
function eq3(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2];
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
function $w(self, $g) {
	const $x = $g;
	let $y = null;
	if ($x[0] === 0) {
		const turn = $x[1];
		$y = enqueue(turn, self[1].v);
	} else {
		const $z = $k(draining_turns.v);
		let $A = null;
		if ($z[0] === 0) {
			const draining = $z[1];
			$A = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$A = undefined;
		}
		$y = $A;
	}
	return $y;
}
function $v(self, value, $e) {
	self[0].v = value;
	$w(self, $e);
}
function $B(self) {
	return self[0].v;
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
function $aa(self, name, value, $ab, $ac) {
	apply(value, self, name, $ab, $ac);
	return __clone(self);
}
function $ad(self, content, $ae, $af) {
	place(content, self, $ae, $af);
	return __clone(self);
}
function $ai(self, transform, $aj) {
	const derived = $a(transform($B(self)));
	self[1].v.push([ fresh_id(), () => {
		$d(derived, transform($B(self)), $aj);
		return;
	} ]);
	return derived;
}
function $aq(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($B(self));
		return;
	} ]);
	observer($B(self));
	return [ self[1], id, __shared_new([ 1 ]) ];
}
function $ar(self, item, $as) {
	self[0].v.push(() => {
		dispose(item, $as);
		return;
	});
	return __clone(item);
}
function $am(self, observer, $an, $ao) {
	$ar(get_owner($ao), $aq(self, observer), $an);
}
function $aA(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $aF(self) {
	return self[0].v;
}
function $aE(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($aF(self));
		return;
	} ]);
	observer($aF(self));
	return [ self[1], id, __shared_new([ 1 ]) ];
}
function $aD(self, observer, $an, $ao) {
	$ar(get_owner($ao), $aE(self, observer), $an);
}
function $aQ(self, $g) {
	const $aR = $g;
	let $aS = null;
	if ($aR[0] === 0) {
		const turn = $aR[1];
		$aS = enqueue(turn, self[1].v);
	} else {
		const $aT = $k(draining_turns.v);
		let $aU = null;
		if ($aT[0] === 0) {
			const draining = $aT[1];
			$aU = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$aU = undefined;
		}
		$aS = $aU;
	}
	return $aS;
}
function $aP(self, value, $e) {
	self[0].v = value;
	$aQ(self, $e);
}
function $aO(self, transform, $aj) {
	const derived = $c(transform($B(self)));
	self[1].v.push([ fresh_id(), () => {
		$aP(derived, transform($B(self)), $aj);
		return;
	} ]);
	return derived;
}
function $aY(self) {
	return self[0].v;
}
function $aX(self, transform, $aj) {
	const derived = $c(transform($aY(self)));
	self[1].v.push([ fresh_id(), () => {
		$aP(derived, transform($aY(self)), $aj);
		return;
	} ]);
	return derived;
}
function $bl(self, b) {
	if (self.length !== b.length) {
		return false;
	}
	let index = 0;
	for (const item of self) {
		if (!(eq2(item, __at(b, index)))) {
			return false;
		}
		index = index + 1;
	}
	return true;
}
function $bk(old_keys, old_items, items, key_of) {
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
				let $bm = null;
				if (eq(__at(old_items, index), item)) {
					$bm = [ 0, index ];
				} else {
					$bm = [ 1, index ];
				}
				step = $bm;
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
function $bq(owner, body) {
	return body(owner);
}
function $bu(self) {
	return self[0].v;
}
function $bt(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($bu(self));
		return;
	} ]);
	observer($bu(self));
	return [ self[1], id, __shared_new([ 1 ]) ];
}
function $bs(self, observer, $an, $ao) {
	$ar(get_owner($ao), $bt(self, observer), $an);
}
function $bh(self, source, key, render, $bi, $bj) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($bj), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$bs(source, (list) => {
		const plan = $bk(row_keys.v, row_items.v, list, key);
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
			const $bn = step;
			let $bo = null;
			if ($bn[0] === 0) {
				const index2 = $bn[1];
				next_views.push(__clone(__at(previous_views, index2)));
				next_owners.push(__clone(__at(previous_owners, index2)));
				$bo = undefined;
			} else if ($bn[0] === 1) {
				const index3 = $bn[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bq(owner, ($bp) => {
					return render(item, $bp);
				}));
				next_owners.push(__clone(owner));
				$bo = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bq(owner2, ($br) => {
					return render(item, $br);
				}));
				next_owners.push(__clone(owner2));
				$bo = undefined;
			}
			$bo;
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
	}, $bi, $bj);
	return __clone(self);
}
function $bw(self) {
	return self[0].v;
}
function $bv(self, transform, $aj) {
	const derived = $c(transform($bw(self)));
	self[1].v.push([ fresh_id(), () => {
		$aP(derived, transform($bw(self)), $aj);
		return;
	} ]);
	return derived;
}
function $bB(old_keys, old_items, items, key_of) {
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
				let $bC = null;
				if (eq3(__at(old_items, index), item)) {
					$bC = [ 0, index ];
				} else {
					$bC = [ 1, index ];
				}
				step = $bC;
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
function $bA(self, source, key, render, $bi, $bj) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($bj), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$bs(source, (list) => {
		const plan = $bB(row_keys.v, row_items.v, list, key);
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
			const $bD = step;
			let $bE = null;
			if ($bD[0] === 0) {
				const index2 = $bD[1];
				next_views.push(__clone(__at(previous_views, index2)));
				next_owners.push(__clone(__at(previous_owners, index2)));
				$bE = undefined;
			} else if ($bD[0] === 1) {
				const index3 = $bD[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bq(owner, ($bp) => {
					return render(item, $bp);
				}));
				next_owners.push(__clone(owner));
				$bE = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bq(owner2, ($br) => {
					return render(item, $br);
				}));
				next_owners.push(__clone(owner2));
				$bE = undefined;
			}
			$bE;
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
	}, $bi, $bj);
	return __clone(self);
}
function $bG(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, __clone(scope) ];
}
function $bH(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $bM(self, transform, $bN) {
	$v(self, transform($bw(self)), $bN);
}
const next_subscriber_id = __shared_new(0);
const draining_turns = __shared_new([  ]);
const app_fill = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::height", [ "::height", [ "s22x0wn", "height:100%" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ] ]) ] ];
const quad_grid = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::gap", [ "::gap", [ "s1x5z460", "gap:1px" ] ] ], [ "::background-color", [ "::background-color", [ "s1h4num7", "background-color:var(--stroke-hard)" ] ] ], [ "::grid-template-columns", [ "::grid-template-columns", [ "send2h", "grid-template-columns:minmax(0, 1fr)" ] ] ], [ "::grid-template-rows", [ "::grid-template-rows", [ "s11r85rj", "grid-template-rows:minmax(0, 8fr) minmax(0, 6fr) minmax(0, 4fr) minmax(0, 4fr)" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s1ox8bcr", "grid-template-columns:minmax(0, 3fr) minmax(0, 2fr)" ] ] ], [ "1024px::grid-template-rows", [ "1024px::grid-template-rows", [ "s1th8vpw", "grid-template-rows:minmax(0, 7fr) minmax(0, 3fr)" ] ] ] ]) ] ];
const panel = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ] ]) ] ];
const panel_head = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::min-height", [ "::min-height", [ "sonfe9c", "min-height:32px" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "sepksxk", "border-bottom:1px solid var(--stroke-soft)" ] ] ] ]) ] ];
const app_bar = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::min-height", [ "::min-height", [ "sonfe9c", "min-height:32px" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "sehiopn", "border-bottom:1px solid var(--stroke-hard)" ] ] ] ]) ] ];
const rail_divider = [ [ new Map([ [ "::width", [ "::width", [ "sgdl0ko", "width:1px" ] ] ], [ "::align-self", [ "::align-self", [ "s1h12z4", "align-self:stretch" ] ] ], [ "::background-color", [ "::background-color", [ "s1h4num7", "background-color:var(--stroke-hard)" ] ] ], [ "::margin-left", [ "::margin-left", [ "szjswwl", "margin-left:2px" ] ] ], [ "::margin-right", [ "::margin-right", [ "suw81y3", "margin-right:2px" ] ] ] ]) ] ];
const page_title = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::color", [ "::color", [ "s1miqier", "color:var(--up-bright)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const panel_title = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzfp8", "font-weight:500" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const editor_host = [ [ new Map([ [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ] ]) ] ];
const runner_host = [ [ new Map([ [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ]) ] ];
const ghost_button = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::background-color", [ "::background-color", [ "s1wmjjx5", "background-color:transparent" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ ":hover:background-color", [ ":hover:background-color", [ "s1s7tv0o", "background-color:var(--down-hover)" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ], [ ":active:background-color", [ ":active:background-color", [ "skghblk", "background-color:var(--down-active)" ] ] ] ]) ] ];
const primary_button = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vfx", "padding-left:var(--space-3)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdpv", "padding-right:var(--space-3)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "sj84onl", "transition:filter 80ms ease" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::background-color", [ "::background-color", [ "s19dy6kf", "background-color:var(--primary)" ] ] ], [ "::color", [ "::color", [ "s30khfz", "color:var(--primary-on)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ ":hover:filter", [ ":hover:filter", [ "s15eo8y8", "filter:brightness(1.08)" ] ] ], [ ":active:filter", [ ":active:filter", [ "sdue9po", "filter:brightness(0.94)" ] ] ] ]) ] ];
const select_box = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::padding-top", [ "::padding-top", [ "s1foenn1", "padding-top:0" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1hggi4x", "padding-bottom:0" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t3pvj", "padding-right:22px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::appearance", [ "::appearance", [ "sxfhabj", "appearance:none" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::border", [ "::border", [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ], [ "::height", [ "::height", [ "s22xxov", "height:24px" ] ] ], [ "::background-image", [ "::background-image", [ "sg7ln4b", "background-image:linear-gradient(45deg, transparent 50%, currentcolor 50%), linear-gradient(135deg, currentcolor 50%, transparent 50%)" ] ] ], [ "::background-position", [ "::background-position", [ "s1cysvk2", "background-position:calc(100% - 13px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px)" ] ] ], [ "::background-size", [ "::background-size", [ "s1fnd457", "background-size:4px 4px, 4px 4px" ] ] ], [ "::background-repeat", [ "::background-repeat", [ "s1q9mjsm", "background-repeat:no-repeat" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s1of7ou7", "border-color:var(--stroke-hard)" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ] ]) ] ];
const version_select = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::padding-top", [ "::padding-top", [ "s1foenn1", "padding-top:0" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1hggi4x", "padding-bottom:0" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t3pvj", "padding-right:22px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::appearance", [ "::appearance", [ "sxfhabj", "appearance:none" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::border", [ "::border", [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ], [ "::height", [ "::height", [ "s22xxov", "height:24px" ] ] ], [ "::background-image", [ "::background-image", [ "sg7ln4b", "background-image:linear-gradient(45deg, transparent 50%, currentcolor 50%), linear-gradient(135deg, currentcolor 50%, transparent 50%)" ] ] ], [ "::background-position", [ "::background-position", [ "s1cysvk2", "background-position:calc(100% - 13px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px)" ] ] ], [ "::background-size", [ "::background-size", [ "s1fnd457", "background-size:4px 4px, 4px 4px" ] ] ], [ "::background-repeat", [ "::background-repeat", [ "s1q9mjsm", "background-repeat:no-repeat" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s1of7ou7", "border-color:var(--stroke-hard)" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ]) ] ];
const status_line = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7ve3", "padding-left:var(--space-1)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdo1", "padding-right:var(--space-1)" ] ] ] ]) ] ];
const confirm_bar = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::min-height", [ "::min-height", [ "sonfe9c", "min-height:32px" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "sepksxk", "border-bottom:1px solid var(--stroke-soft)" ] ] ] ]) ] ];
const confirm_question = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ]) ] ];
const report_well = [ [ new Map([ [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8cl8", "line-height:18px" ] ] ], [ "::white-space", [ "::white-space", [ "s41qynl", "white-space:pre-wrap" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ]) ] ];
const diag_row_error = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5sm0", "padding-top:3px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzuf0", "padding-bottom:3px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::border-top", [ "::border-top", [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ], [ ":first-child:border-top", [ ":first-child:border-top", [ "sq2xqkq", "border-top:1px solid transparent" ] ] ], [ "::border-left", [ "::border-left", [ "s1v5t6xm", "border-left:2px solid var(--down-danger)" ] ] ], [ "::background-color", [ "::background-color", [ "s1er9mcg", "background-color:rgb(from var(--down-danger) r g b / 0.07)" ] ] ] ]) ] ];
const diag_row_warning = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5sm0", "padding-top:3px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzuf0", "padding-bottom:3px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::border-top", [ "::border-top", [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ], [ ":first-child:border-top", [ ":first-child:border-top", [ "sq2xqkq", "border-top:1px solid transparent" ] ] ], [ "::border-left", [ "::border-left", [ "somu7p8", "border-left:2px solid var(--down-caution)" ] ] ], [ "::background-color", [ "::background-color", [ "s6ng1wh", "background-color:rgb(from var(--down-caution) r g b / 0.06)" ] ] ] ]) ] ];
const diag_error = [ [ new Map([ [ "::color", [ "::color", [ "sxurvz1", "color:var(--up-error)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ] ]) ] ];
const diag_warning = [ [ new Map([ [ "::color", [ "::color", [ "s7y076u", "color:var(--up-caution)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ] ]) ] ];
const diag_site = [ [ new Map([ [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const diag_note = [ [ new Map([ [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const diag_trace = [ [ new Map([ [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const console_line = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5qxi", "padding-top:1px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzsqi", "padding-bottom:1px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ]) ] ];
const console_error = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5qxi", "padding-top:1px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzsqi", "padding-bottom:1px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::color", [ "::color", [ "sxurvz1", "color:var(--up-error)" ] ] ] ]) ] ];
const quiet_row = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5sm0", "padding-top:3px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzuf0", "padding-bottom:3px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const code_palette = [ [ new Map([ [ "::--code-face", [ "::--code-face", [ "sepvury", "--code-face:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::--code-features", [ "::--code-features", [ "s1xx7ixb", "--code-features:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ], [ "::--code-size", [ "::--code-size", [ "s17tflw5", "--code-size:13px" ] ] ], [ "::--code-bg", [ "::--code-bg", [ "sr79rlz", "--code-bg:var(--down-normal)" ] ] ], [ "::--code-fg", [ "::--code-fg", [ "s19c5xn7", "--code-fg:var(--up-bright)" ] ] ], [ "::--code-dim", [ "::--code-dim", [ "s1u3ovjb", "--code-dim:var(--up-dim)" ] ] ], [ "::--code-gutter-edge", [ "::--code-gutter-edge", [ "s19k3kma", "--code-gutter-edge:var(--stroke-soft)" ] ] ], [ "::--code-active-line", [ "::--code-active-line", [ "s1fhczbb", "--code-active-line:rgb(from var(--up-bright) r g b / 0.04)" ] ] ], [ "::--code-active-gutter", [ "::--code-active-gutter", [ "s1t1pcq8", "--code-active-gutter:rgb(from var(--up-bright) r g b / 0.07)" ] ] ], [ "::--code-selection", [ "::--code-selection", [ "snky57a", "--code-selection:rgb(from var(--up-bright) r g b / 0.18)" ] ] ], [ "::--code-keyword", [ "::--code-keyword", [ "sbb9pzp", "--code-keyword:var(--primary)" ] ] ], [ "::--code-string", [ "::--code-string", [ "s18b2uzn", "--code-string:var(--accent)" ] ] ], [ "::--code-plain", [ "::--code-plain", [ "s8onzey", "--code-plain:var(--up-normal)" ] ] ], [ "::--code-callable", [ "::--code-callable", [ "s16k06qr", "--code-callable:var(--tint-callable)" ] ] ], [ "::--code-type", [ "::--code-type", [ "s1n2n3b1", "--code-type:var(--up-bright)" ] ] ], [ "::--code-comment", [ "::--code-comment", [ "s5j3euk", "--code-comment:var(--tint-comment)" ] ] ], [ "::--code-attr", [ "::--code-attr", [ "s14j98t0", "--code-attr:rgb(from var(--primary) r g b / 0.65)" ] ] ], [ "::--code-path", [ "::--code-path", [ "s7em04x", "--code-path:rgb(from var(--up-bright) r g b / 0.6)" ] ] ], [ "::--code-operator", [ "::--code-operator", [ "s8nt3s2", "--code-operator:rgb(from var(--up-bright) r g b / 0.72)" ] ] ], [ "::--code-error", [ "::--code-error", [ "s1dxptvb", "--code-error:var(--up-error)" ] ] ], [ "::--code-caution", [ "::--code-caution", [ "s1yauy2a", "--code-caution:var(--up-caution)" ] ] ] ]) ] ];
const shell = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::min-height", [ "::min-height", [ "sondrfd", "min-height:100%" ] ] ], [ "::font-family", [ "::font-family", [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayk3oa", "font-size:14px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8cl8", "line-height:18px" ] ] ] ]) ] ];
const no_drag = [ [ new Map([ [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const nav_brand = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odkmbv", "letter-spacing:0.35em" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ] ]) ] ];
const nav_mark = [ [ new Map([ [ "::display", [ "::display", [ "sowfjmu", "display:block" ] ] ], [ "::width", [ "::width", [ "s178hbq8", "width:36px" ] ] ], [ "::height", [ "::height", [ "s22x9bm", "height:18px" ] ] ], [ "::background-color", [ "::background-color", [ "syz58y5", "background-color:var(--up-bright)" ] ] ], [ "::-webkit-mask", [ "::-webkit-mask", [ "scqkrg6", "-webkit-mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ], [ "::mask", [ "::mask", [ "s11mtiwm", "mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ] ]) ] ];
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
	$v(console_lines, [  ], [ 1 ]);
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
	const name = $B(confirm_target);
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
		let trace = [  ];
		for (const hop of diagnostic.trace) {
			trace.push([ hop.file, hop.line + 1, hop.column + 1, hop.message, hop.call ]);
		}
		rows.push([ id, diagnostic.severity, diagnostic.file, diagnostic.line + 1, diagnostic.column + 1, diagnostic.message, diagnostic.note, __clone(trace) ]);
		id = id + 1;
	}
	next_row_id.v = id;
	$p(diagnostics, rows, [ 1 ]);
	return rows.length;
};
mount_root("app", ($I) => {
	return playground_page(status, diagnostics, console_lines, can_format, can_platform, share_label, mode, modified_from, confirm_target, run, format, share, confirm_replace, cancel_replace, [ 1 ], $I);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $bJ = null;
	if (kind === "ready") {
		$aP(can_format, event.canFormat, [ 1 ]);
		$aP(can_platform, event.canPlatform, [ 1 ]);
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
		$bJ = undefined;
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
		$bJ = undefined;
	} else if (kind === "formatted") {
		if (event.changed) {
			$d(status, "Formatted.", [ 1 ]);
		} else {
			$d(status, "Format made no changes.", [ 1 ]);
		}
		$bJ = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			$d(status, "Link copied to the clipboard.", [ 1 ]);
			flash_share("Copied!");
		} else {
			$d(status, "Link ready in the address bar.", [ 1 ]);
			flash_share("Link ready");
		}
		$bJ = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $bK = null;
		if (event.ok) {
			if (event.platform === "node") {
				$d(status, "No problems (server check, vilan " + event.version + ").", [ 1 ]);
			} else {
				$d(status, "No problems (vilan " + event.version + ").", [ 1 ]);
			}
			$bK = undefined;
		} else if (count === 1) {
			$d(status, "1 problem; see the diagnostics.", [ 1 ]);
		} else {
			$d(status, "" + count + " problems; see the diagnostics.", [ 1 ]);
		}
		$bJ = $bK;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $bL = null;
		if (event.platform === "node") {
			if (event.ok) {
				$d(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ]);
			} else {
				$d(status, "Build failed; see the diagnostics.", [ 1 ]);
			}
			$bL = undefined;
		} else {
			$v(console_lines, [  ], [ 1 ]);
			if (event.ok) {
				$d(status, "Compiled (vilan " + event.version + ")", [ 1 ]);
				VilanPlayground.runProgram(event.js, event.css);
			} else {
				$d(status, "Build failed; see the diagnostics.", [ 1 ]);
				VilanPlayground.clearProgram();
			}
			$bL = undefined;
		}
		$bJ = $bL;
	} else if (kind === "crash") {
		$d(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $bJ;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const kind = message.kind;
	if (kind === "log" || kind === "error") {
		$bM(console_lines, (lines) => {
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
