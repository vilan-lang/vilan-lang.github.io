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
		while (!($m(turn[0].v)) && budget > 0) {
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
function dispose(self, $av) {
	let kept = [  ];
	for (const subscriber of self[0].v) {
		if (subscriber[0] !== self[1]) {
			kept.push(__clone(subscriber));
		}
	}
	self[0].v = kept;
	const $aw = $av;
	let $ax = null;
	if ($aw[0] === 0) {
		const turn = $aw[1];
		let kept_pending = [  ];
		for (const subscriber2 of turn[0].v) {
			if (subscriber2[0] !== self[1]) {
				kept_pending.push(__clone(subscriber2));
			}
		}
		turn[0].v = kept_pending;
		$ax = undefined;
	} else {
		$ax = undefined;
	}
	$ax;
	const $ay = self[2].v;
	let $az = null;
	if ($ay[0] === 0) {
		const release = $ay[1];
		self[2].v = [ 1 ];
		release();
		$az = undefined;
	} else {
		$az = undefined;
	}
	return $az;
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
function get_owner($aG) {
	return $aG;
}
function register_with_owner(subscription, $ap, $aq) {
	const $ar = $aq;
	let $as = null;
	if ($ar[0] === 0) {
		const owner = $ar[1];
		$as = $at(owner, subscription, $ap);
	} else {
		$as = __clone(subscription);
	}
	return $as;
}
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $B) {
	return await (self[0].wait(ambient_signal($B)));
}
function cancel(self) {
	self[0].cancel();
}
function ambient_signal($C) {
	const $D = $C;
	let $E = null;
	if ($D[0] === 0) {
		const n = $D[1];
		$E = [ 0, n.signal_of() ];
	} else {
		$E = [ 1 ];
	}
	return $E;
}
function view(tag) {
	let $Q = null;
	if (is_svg_tag(tag)) {
		$Q = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$Q = [ document.createElement(tag) ];
	}
	return $Q;
}
function is_svg_tag(tag) {
	const $O = tag;
	let $P = null;
	if ($O === "svg") {
		$P = true;
	} else if ($O === "path") {
		$P = true;
	} else if ($O === "circle") {
		$P = true;
	} else if ($O === "ellipse") {
		$P = true;
	} else if ($O === "rect") {
		$P = true;
	} else if ($O === "line") {
		$P = true;
	} else if ($O === "polyline") {
		$P = true;
	} else if ($O === "polygon") {
		$P = true;
	} else if ($O === "g") {
		$P = true;
	} else if ($O === "defs") {
		$P = true;
	} else if ($O === "use") {
		$P = true;
	} else if ($O === "symbol") {
		$P = true;
	} else if ($O === "marker") {
		$P = true;
	} else if ($O === "pattern") {
		$P = true;
	} else if ($O === "mask") {
		$P = true;
	} else if ($O === "clipPath") {
		$P = true;
	} else if ($O === "linearGradient") {
		$P = true;
	} else if ($O === "radialGradient") {
		$P = true;
	} else if ($O === "stop") {
		$P = true;
	} else if ($O === "text") {
		$P = true;
	} else if ($O === "tspan") {
		$P = true;
	} else if ($O === "textPath") {
		$P = true;
	} else if ($O === "filter") {
		$P = true;
	} else if ($O === "foreignObject") {
		$P = true;
	} else if ($O === "feGaussianBlur") {
		$P = true;
	} else if ($O === "feColorMatrix") {
		$P = true;
	} else if ($O === "feOffset") {
		$P = true;
	} else if ($O === "feMerge") {
		$P = true;
	} else if ($O === "feMergeNode") {
		$P = true;
	} else if ($O === "feFlood") {
		$P = true;
	} else if ($O === "feComposite") {
		$P = true;
	} else if ($O === "feBlend") {
		$P = true;
	} else if ($O === "feDropShadow") {
		$P = true;
	} else {
		$P = false;
	}
	return $P;
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
		return $aK([ 1 ], ($aJ) => {
			return handler($aJ);
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
	const $bX = $aK([ 1 ], ($bU) => {
		return $bV(body);
	});
	const built = $bX[0];
	const root = $bX[1];
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
	const $X = property;
	let $Y = null;
	if ($X === "padding") {
		$Y = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($X === "margin") {
		$Y = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($X === "inset") {
		$Y = ";top;right;bottom;left;";
	} else if ($X === "flex") {
		$Y = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($X === "background") {
		$Y = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($X === "border") {
		$Y = border_longhands();
	} else {
		$Y = "";
	}
	return $Y;
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
	for (const key of $R(rules)) {
		const parts = key.split(":");
		if (__at(parts, 0) === media && __at(parts, 1) === condition && longhands.includes(";" + __at(parts, 2) + ";")) {
			$Z(out, key);
		}
	}
	return out;
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
	for (const key of $R(b[0])) {
		const $V = $S(b[0], key);
		let $W = null;
		if ($V[0] === 0) {
			const entry = $V[1];
			const parts = key.split(":");
			rules = without_covered(rules, __at(parts, 0), __at(parts, 1), __at(parts, 2));
			$aa(rules, key, entry);
			$W = undefined;
		} else {
			$W = undefined;
		}
		$W;
	}
	return [ rules ];
}
function template_option(value, label, $aS, $aT) {
	return text($ad(view("option"), "value", value, $aS, $aT), label);
}
function template_title(name) {
	const $aY = name;
	let $aZ = null;
	if ($aY === "counter") {
		$aZ = "Counter";
	} else if ($aY === "hello") {
		$aZ = "Hello";
	} else if ($aY === "styles") {
		$aZ = "Styles";
	} else if ($aY === "server") {
		$aZ = "Server";
	} else {
		$aZ = name;
	}
	return $aZ;
}
function severity_tag(row) {
	const $bp = row[1];
	let $bq = null;
	if ($bp === "error") {
		$bq = text(styled(view("span"), diag_error), "error");
	} else {
		$bq = text(styled(view("span"), diag_warning), "warning");
	}
	return $bq;
}
function trace_row(hop) {
	let $br = null;
	if (hop[4]) {
		$br = "  via " + hop[0] + ":" + hop[1] + ":" + hop[2] + " \u{2014} " + hop[3];
	} else {
		$br = "  " + hop[3];
	}
	const text2 = $br;
	return text(styled(view("div"), diag_trace), text2);
}
function diagnostic_row(row, $bn, $bo) {
	const head = $ag($ag($ag(view("div"), severity_tag(row), $bn, $bo), text(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " "), $bn, $bo), text(view("span"), row[5]), $bn, $bo);
	let lines = [ head ];
	for (const hop of row[7]) {
		lines.push(trace_row(hop));
	}
	if (row[6] !== "") {
		lines.push(text(styled(view("div"), diag_note), "  note: " + row[6]));
	}
	const body = children(view("div"), lines);
	const $bs = row[1];
	let $bt = null;
	if ($bs === "error") {
		$bt = $ag(styled(view("div"), diag_row_error), body, $bn, $bo);
	} else {
		$bt = $ag(styled(view("div"), diag_row_warning), body, $bn, $bo);
	}
	return $bt;
}
function console_row(row) {
	const $bL = row[1];
	let $bM = null;
	if ($bL === "error") {
		$bM = text(styled(view("div"), console_error), row[2]);
	} else {
		$bM = text(styled(view("div"), console_line), row[2]);
	}
	return $bM;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, share_label2, mode2, modified_from2, confirm_target2, run2, format2, share2, confirm_replace2, cancel_replace2, $M, $N) {
	return $ag($ag(styled(view("div"), add(add(shell, app_fill), code_palette)), $ag($ag($ag($ag($ag($ag($ag($ag($ag($ag($ag(styled(view("header"), app_bar), $ag($ag($ad(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $M, $N), $ad(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $M, $N), $M, $N), text(view("span"), "VILAN"), $M, $N), $M, $N), text(styled(view("h1"), page_title), "Playground"), $M, $N), styled(view("div"), rail_divider), $M, $N), on($aA(styled(view("button"), primary_button), $al(mode2, (current) => {
		const $aj = current;
		let $ak = null;
		if ($aj === "node") {
			$ak = "Check";
		} else {
			$ak = "Run";
		}
		return $ak;
	}, $M, [ 0, $N ]), $M, $N), "click", ($aI) => {
		return run2();
	}), $M, $N), $ag($ag($aL($ad($ad(styled(view("select"), select_box), "id", "mode", $M, $N), "aria-label", "Compile mode", $M, $N), can_platform2, $M, $N), template_option("browser", "Browser: compile and run", $M, $N), $M, $N), template_option("node", "Server: check the process leg", $M, $N), $M, $N), $M, $N), $aL(on(text(styled(view("button"), ghost_button), "Format"), "click", ($aU) => {
		return format2();
	}), can_format2, $M, $N), $M, $N), on($aA(styled(view("button"), ghost_button), share_label2, $M, $N), "click", ($aV) => {
		return share2();
	}), $M, $N), $aA($ad(styled(view("p"), status_line), "role", "status", $M, $N), status2, $M, $N), $M, $N), $ad($ad(styled(view("select"), version_select), "id", "version", $M, $N), "aria-label", "Compiler version", $M, $N), $M, $N), styled(view("div"), rail_divider), $M, $N), text($ad(styled(view("a"), nav_link), "href", "/docs/", $M, $N), "Docs"), $M, $N), $M, $N), $ag($ag($ag($ag(styled(view("main"), quad_grid), $ag($ag($ag(styled(view("div"), panel), $ag($ag(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Program"), $M, $N), $ag($ag($ag($ag($ag($ad($ad(styled(view("select"), select_box), "id", "template", $M, $N), "aria-label", "Load an example", $M, $N), $aA($ad($ad($ad(view("option"), "value", "", $M, $N), "disabled", "true", $M, $N), "hidden", "true", $M, $N), $al(modified_from2, (name) => {
		const $aW = name;
		let $aX = null;
		if ($aW === "") {
			$aX = "Examples";
		} else {
			$aX = "Modified \u{2014} " + template_title(name);
		}
		return $aX;
	}, $M, [ 0, $N ]), $M, $N), $M, $N), template_option("counter", "Counter: reactive state", $M, $N), $M, $N), template_option("hello", "Hello: mount and print", $M, $N), $M, $N), template_option("styles", "Styles: compile-time CSS", $M, $N), $M, $N), $aL(template_option("server", "Server: typed HTTP, checked", $M, $N), can_platform2, $M, $N), $M, $N), $M, $N), $M, $N), $ag($aL($ad(view("div"), "role", "alert", $M, $N), $ba(confirm_target2, (name) => {
		return name !== "";
	}, $M, [ 0, $N ]), $M, $N), $ag($ag($ag(styled(view("div"), confirm_bar), $aA(styled(view("p"), confirm_question), $al(confirm_target2, (name) => {
		return "Replace the current program with " + template_title(name) + "? The edits are not kept.";
	}, $M, [ 0, $N ]), $M, $N), $M, $N), on(text(styled(view("button"), ghost_button), "Keep editing"), "click", ($bh) => {
		return cancel_replace2();
	}), $M, $N), on(text(styled(view("button"), primary_button), "Replace"), "click", ($bi) => {
		return confirm_replace2();
	}), $M, $N), $M, $N), $M, $N), $ad($ad(styled(view("div"), editor_host), "id", "editor", $M, $N), "aria-label", "Program editor", $M, $N), $M, $N), $M, $N), $ag($ag(styled(view("div"), panel), $ag(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Result"), $M, $N), $M, $N), $ad($ad(styled(view("div"), runner_host), "id", "runner", $M, $N), "aria-label", "Program result", $M, $N), $M, $N), $M, $N), $ag($ag(styled(view("div"), panel), $ag(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Diagnostics"), $M, $N), $M, $N), $ag($ag(styled(view("pre"), report_well), $aL(text(styled(view("div"), quiet_row), "Nothing to report."), $bj(diagnostics2, (rows) => {
		return rows.length === 0;
	}, $M, [ 0, $N ]), $M, $N), $M, $N), $bu(view("div"), diagnostics2, (row) => {
		return row[0];
	}, (row, $bm) => {
		return diagnostic_row(row, $M, $bm);
	}, $M, $N), $M, $N), $M, $N), $M, $N), $ag($ag(styled(view("div"), panel), $ag(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Console"), $M, $N), $M, $N), $ag($ag(styled(view("pre"), report_well), $aL(text(styled(view("div"), quiet_row), "Program output lands here."), $bj(console_lines2, (rows) => {
		return rows.length === 0;
	}, $M, [ 0, $N ]), $M, $N), $M, $N), $bN(view("div"), console_lines2, (row) => {
		return row[0];
	}, (row, $bK) => {
		return console_row(row);
	}, $M, $N), $M, $N), $M, $N), $M, $N), $M, $N);
}
function eq(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2] && self[3] === other[3] && self[4] === other[4] && self[5] === other[5] && self[6] === other[6] && $by(self[7], other[7]);
}
function eq2(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2] && self[3] === other[3] && self[4] === other[4];
}
function eq3(self, other) {
	return self[0] === other[0] && self[1] === other[1] && self[2] === other[2];
}
function $b(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function $a(value) {
	return $b(value);
}
function $c(value) {
	return $b(value);
}
function $m(self) {
	return self.length === 0;
}
function $n(self) {
	return __list_get(self, self.length - 1);
}
function $i(self, $j) {
	const $k = $j;
	let $l = null;
	if ($k[0] === 0) {
		const turn = $k[1];
		$l = enqueue(turn, self[1].v);
	} else {
		const $o = $n(draining_turns.v);
		let $p = null;
		if ($o[0] === 0) {
			const draining = $o[1];
			$p = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$p = undefined;
		}
		$l = $p;
	}
	return $l;
}
function $g(self, value, $h) {
	self[0].v = value;
	$i(self, $h);
}
function $t(self, $j) {
	const $u = $j;
	let $v = null;
	if ($u[0] === 0) {
		const turn = $u[1];
		$v = enqueue(turn, self[1].v);
	} else {
		const $w = $n(draining_turns.v);
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
function $s(self, value, $h) {
	self[0].v = value;
	$t(self, $h);
}
function $y(self) {
	return self[0].v;
}
function $G(self, $j) {
	const $H = $j;
	let $I = null;
	if ($H[0] === 0) {
		const turn = $H[1];
		$I = enqueue(turn, self[1].v);
	} else {
		const $J = $n(draining_turns.v);
		let $K = null;
		if ($J[0] === 0) {
			const draining = $J[1];
			$K = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$K = undefined;
		}
		$I = $K;
	}
	return $I;
}
function $F(self, value, $h) {
	self[0].v = value;
	$G(self, $h);
}
function $R(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[0]));
	}
	return result;
}
function $S(self, key) {
	const $T = __map_get(self[0], hash(key));
	let $U = null;
	if ($T[0] === 0) {
		const entry = $T[1];
		$U = [ 0, __clone(entry[1]) ];
	} else {
		$U = [ 1 ];
	}
	return $U;
}
function $Z(self, key) {
	self[0].delete(hash(key));
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
function $ad(self, name, value, $ae, $af) {
	apply(value, self, name, $ae, $af);
	return __clone(self);
}
function $ag(self, content, $ah, $ai) {
	place(content, self, $ah, $ai);
	return __clone(self);
}
function $ao(signal, observer) {
	const id = fresh_id();
	const cell = signal[0];
	signal[1].v.push([ id, () => {
		observer(cell.v);
		return;
	} ]);
	return [ signal[1], id, __shared_new([ 1 ]) ];
}
function $at(self, item, $au) {
	self[0].v.push(() => {
		dispose(item, $au);
		return;
	});
	return __clone(item);
}
function $al(self, transform, $am, $an) {
	const derived = $b(transform($y(self)));
	register_with_owner($ao(self, (value) => {
		$g(derived, transform(value), $am);
		return;
	}), $am, $an);
	return derived;
}
function $aH(self, observer) {
	const subscription = $ao(self, observer);
	observer($y(self));
	return subscription;
}
function $aD(self, observer, $aE, $aF) {
	$at(get_owner($aF), $aH(self, observer), $aE);
}
function $aA(self, source, $aB, $aC) {
	const element = __clone(self[0]);
	$aD(source, (value) => {
		element.textContent = value;
		return;
	}, $aB, $aC);
	return __clone(self);
}
function $aK(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $aO(self, observer, $aE, $aF) {
	$at(get_owner($aF), $aH(self, observer), $aE);
}
function $aL(self, condition, $aM, $aN) {
	const element = __clone(self[0]);
	$aO(condition, (visible) => {
		element.hidden = !(visible);
		return;
	}, $aM, $aN);
	return __clone(self);
}
function $bc(self, $j) {
	const $bd = $j;
	let $be = null;
	if ($bd[0] === 0) {
		const turn = $bd[1];
		$be = enqueue(turn, self[1].v);
	} else {
		const $bf = $n(draining_turns.v);
		let $bg = null;
		if ($bf[0] === 0) {
			const draining = $bf[1];
			$bg = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bg = undefined;
		}
		$be = $bg;
	}
	return $be;
}
function $bb(self, value, $h) {
	self[0].v = value;
	$bc(self, $h);
}
function $ba(self, transform, $am, $an) {
	const derived = $b(transform($y(self)));
	register_with_owner($ao(self, (value) => {
		$bb(derived, transform(value), $am);
		return;
	}), $am, $an);
	return derived;
}
function $bj(self, transform, $am, $an) {
	const derived = $b(transform($y(self)));
	register_with_owner($ao(self, (value) => {
		$bb(derived, transform(value), $am);
		return;
	}), $am, $an);
	return derived;
}
function $by(self, b) {
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
function $bx(old_keys, old_items, items, key_of) {
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
				let $bz = null;
				if (eq(__at(old_items, index), item)) {
					$bz = [ 0, index ];
				} else {
					$bz = [ 1, index ];
				}
				step = $bz;
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
function $bD(owner, body) {
	return body(owner);
}
function $bu(self, source, key, render, $bv, $bw) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($bw), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$aO(source, (list) => {
		const plan = $bx(row_keys.v, row_items.v, list, key);
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
			const $bA = step;
			let $bB = null;
			if ($bA[0] === 0) {
				const index2 = $bA[1];
				next_views.push(__clone(__at(previous_views, index2)));
				next_owners.push(__clone(__at(previous_owners, index2)));
				$bB = undefined;
			} else if ($bA[0] === 1) {
				const index3 = $bA[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bD(owner, ($bC) => {
					return render(item, $bC);
				}));
				next_owners.push(owner);
				$bB = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bD(owner2, ($bE) => {
					return render(item, $bE);
				}));
				next_owners.push(owner2);
				$bB = undefined;
			}
			$bB;
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
	}, $bv, $bw);
	return __clone(self);
}
function $bO(old_keys, old_items, items, key_of) {
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
				let $bP = null;
				if (eq3(__at(old_items, index), item)) {
					$bP = [ 0, index ];
				} else {
					$bP = [ 1, index ];
				}
				step = $bP;
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
function $bN(self, source, key, render, $bv, $bw) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($bw), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$aO(source, (list) => {
		const plan = $bO(row_keys.v, row_items.v, list, key);
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
			const $bQ = step;
			let $bR = null;
			if ($bQ[0] === 0) {
				const index2 = $bQ[1];
				next_views.push(__clone(__at(previous_views, index2)));
				next_owners.push(__clone(__at(previous_owners, index2)));
				$bR = undefined;
			} else if ($bQ[0] === 1) {
				const index3 = $bQ[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($bD(owner, ($bC) => {
					return render(item, $bC);
				}));
				next_owners.push(owner);
				$bR = undefined;
			} else {
				const owner2 = new3();
				next_views.push($bD(owner2, ($bE) => {
					return render(item, $bE);
				}));
				next_owners.push(owner2);
				$bR = undefined;
			}
			$bR;
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
	}, $bv, $bw);
	return __clone(self);
}
function $bV(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, scope ];
}
function $cb(self, transform, $cc) {
	$s(self, transform($y(self)), $cc);
}
const next_subscriber_id = __shared_new(0);
const draining_turns = __shared_new([  ]);
const app_fill = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::height", [ "::height", [ "s22x0wn", "height:100%" ] ] ] ]) ] ];
const quad_grid = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::gap", [ "::gap", [ "s1x5z460", "gap:1px" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::background-color", [ "::background-color", [ "s1h4num7", "background-color:var(--stroke-hard)" ] ] ], [ "::grid-template-columns", [ "::grid-template-columns", [ "send2h", "grid-template-columns:minmax(0, 1fr)" ] ] ], [ "::grid-template-rows", [ "::grid-template-rows", [ "s11r85rj", "grid-template-rows:minmax(0, 8fr) minmax(0, 6fr) minmax(0, 4fr) minmax(0, 4fr)" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s1ox8bcr", "grid-template-columns:minmax(0, 3fr) minmax(0, 2fr)" ] ] ], [ "1024px::grid-template-rows", [ "1024px::grid-template-rows", [ "s1th8vpw", "grid-template-rows:minmax(0, 7fr) minmax(0, 3fr)" ] ] ] ]) ] ];
const panel = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ]) ] ];
const panel_head = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::min-height", [ "::min-height", [ "sonfe9c", "min-height:32px" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "sepksxk", "border-bottom:1px solid var(--stroke-soft)" ] ] ] ]) ] ];
const app_bar = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::min-height", [ "::min-height", [ "sonfe9c", "min-height:32px" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "sehiopn", "border-bottom:1px solid var(--stroke-hard)" ] ] ] ]) ] ];
const rail_divider = [ [ new Map([ [ "::width", [ "::width", [ "sgdl0ko", "width:1px" ] ] ], [ "::align-self", [ "::align-self", [ "s1h12z4", "align-self:stretch" ] ] ], [ "::margin-left", [ "::margin-left", [ "szjswwl", "margin-left:2px" ] ] ], [ "::margin-right", [ "::margin-right", [ "suw81y3", "margin-right:2px" ] ] ], [ "::background-color", [ "::background-color", [ "s1h4num7", "background-color:var(--stroke-hard)" ] ] ] ]) ] ];
const page_title = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1miqier", "color:var(--up-bright)" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const panel_title = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzfp8", "font-weight:500" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const editor_host = [ [ new Map([ [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ] ]) ] ];
const runner_host = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ]) ] ];
const ghost_button = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::transition", [ "::transition", [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::background-color", [ "::background-color", [ "s1wmjjx5", "background-color:transparent" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ], [ ":hover:background-color", [ ":hover:background-color", [ "s1s7tv0o", "background-color:var(--down-hover)" ] ] ], [ ":active:background-color", [ ":active:background-color", [ "skghblk", "background-color:var(--down-active)" ] ] ] ]) ] ];
const primary_button = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vfx", "padding-left:var(--space-3)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdpv", "padding-right:var(--space-3)" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::transition", [ "::transition", [ "sj84onl", "transition:filter 80ms ease" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s30khfz", "color:var(--primary-on)" ] ] ], [ "::background-color", [ "::background-color", [ "s19dy6kf", "background-color:var(--primary)" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ ":hover:filter", [ ":hover:filter", [ "s15eo8y8", "filter:brightness(1.08)" ] ] ], [ ":active:filter", [ ":active:filter", [ "sdue9po", "filter:brightness(0.94)" ] ] ] ]) ] ];
const select_box = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::padding-top", [ "::padding-top", [ "s1foenn1", "padding-top:0" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1hggi4x", "padding-bottom:0" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t3pvj", "padding-right:22px" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::transition", [ "::transition", [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::appearance", [ "::appearance", [ "sxfhabj", "appearance:none" ] ] ], [ "::height", [ "::height", [ "s22xxov", "height:24px" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::border", [ "::border", [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ], [ "::background-image", [ "::background-image", [ "sg7ln4b", "background-image:linear-gradient(45deg, transparent 50%, currentcolor 50%), linear-gradient(135deg, currentcolor 50%, transparent 50%)" ] ] ], [ "::background-position", [ "::background-position", [ "s1cysvk2", "background-position:calc(100% - 13px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px)" ] ] ], [ "::background-size", [ "::background-size", [ "s1fnd457", "background-size:4px 4px, 4px 4px" ] ] ], [ "::background-repeat", [ "::background-repeat", [ "s1q9mjsm", "background-repeat:no-repeat" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s1of7ou7", "border-color:var(--stroke-hard)" ] ] ] ]) ] ];
const version_select = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::padding-top", [ "::padding-top", [ "s1foenn1", "padding-top:0" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1hggi4x", "padding-bottom:0" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t3pvj", "padding-right:22px" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::transition", [ "::transition", [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::appearance", [ "::appearance", [ "sxfhabj", "appearance:none" ] ] ], [ "::height", [ "::height", [ "s22xxov", "height:24px" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::border", [ "::border", [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ], [ "::background-image", [ "::background-image", [ "sg7ln4b", "background-image:linear-gradient(45deg, transparent 50%, currentcolor 50%), linear-gradient(135deg, currentcolor 50%, transparent 50%)" ] ] ], [ "::background-position", [ "::background-position", [ "s1cysvk2", "background-position:calc(100% - 13px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px)" ] ] ], [ "::background-size", [ "::background-size", [ "s1fnd457", "background-size:4px 4px, 4px 4px" ] ] ], [ "::background-repeat", [ "::background-repeat", [ "s1q9mjsm", "background-repeat:no-repeat" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s1of7ou7", "border-color:var(--stroke-hard)" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ]) ] ];
const status_line = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7ve3", "padding-left:var(--space-1)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdo1", "padding-right:var(--space-1)" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const confirm_bar = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::min-height", [ "::min-height", [ "sonfe9c", "min-height:32px" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "sepksxk", "border-bottom:1px solid var(--stroke-soft)" ] ] ] ]) ] ];
const confirm_question = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ], [ "::line-height", [ "::line-height", [ "snq8awq", "line-height:16px" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ]) ] ];
const report_well = [ [ new Map([ [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ], [ "::flex", [ "::flex", [ "smaui08", "flex:1 1 auto" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5tg9", "padding-top:4px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzv99", "padding-bottom:4px" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::min-height", [ "::min-height", [ "sivwxlf", "min-height:0" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8cl8", "line-height:18px" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::white-space", [ "::white-space", [ "s41qynl", "white-space:pre-wrap" ] ] ] ]) ] ];
const diag_row_error = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5sm0", "padding-top:3px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzuf0", "padding-bottom:3px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::border-top", [ "::border-top", [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ], [ "::border-left", [ "::border-left", [ "s1v5t6xm", "border-left:2px solid var(--down-danger)" ] ] ], [ ":first-child:border-top", [ ":first-child:border-top", [ "sq2xqkq", "border-top:1px solid transparent" ] ] ], [ "::background-color", [ "::background-color", [ "s1er9mcg", "background-color:rgb(from var(--down-danger) r g b / 0.07)" ] ] ] ]) ] ];
const diag_row_warning = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5sm0", "padding-top:3px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzuf0", "padding-bottom:3px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::border-top", [ "::border-top", [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ], [ "::border-left", [ "::border-left", [ "somu7p8", "border-left:2px solid var(--down-caution)" ] ] ], [ ":first-child:border-top", [ ":first-child:border-top", [ "sq2xqkq", "border-top:1px solid transparent" ] ] ], [ "::background-color", [ "::background-color", [ "s6ng1wh", "background-color:rgb(from var(--down-caution) r g b / 0.06)" ] ] ] ]) ] ];
const diag_error = [ [ new Map([ [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "sxurvz1", "color:var(--up-error)" ] ] ] ]) ] ];
const diag_warning = [ [ new Map([ [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s7y076u", "color:var(--up-caution)" ] ] ] ]) ] ];
const diag_site = [ [ new Map([ [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const diag_note = [ [ new Map([ [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const diag_trace = [ [ new Map([ [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const console_line = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5qxi", "padding-top:1px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzsqi", "padding-bottom:1px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ]) ] ];
const console_error = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5qxi", "padding-top:1px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzsqi", "padding-bottom:1px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::color", [ "::color", [ "sxurvz1", "color:var(--up-error)" ] ] ] ]) ] ];
const quiet_row = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "sku5sm0", "padding-top:3px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzuf0", "padding-bottom:3px" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ], [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const code_palette = [ [ new Map([ [ "::--code-face", [ "::--code-face", [ "sepvury", "--code-face:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::--code-features", [ "::--code-features", [ "s1xx7ixb", "--code-features:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ], [ "::--code-size", [ "::--code-size", [ "s17tflw5", "--code-size:13px" ] ] ], [ "::--code-bg", [ "::--code-bg", [ "sr79rlz", "--code-bg:var(--down-normal)" ] ] ], [ "::--code-fg", [ "::--code-fg", [ "s19c5xn7", "--code-fg:var(--up-bright)" ] ] ], [ "::--code-dim", [ "::--code-dim", [ "s1u3ovjb", "--code-dim:var(--up-dim)" ] ] ], [ "::--code-gutter-edge", [ "::--code-gutter-edge", [ "s19k3kma", "--code-gutter-edge:var(--stroke-soft)" ] ] ], [ "::--code-active-line", [ "::--code-active-line", [ "s1fhczbb", "--code-active-line:rgb(from var(--up-bright) r g b / 0.04)" ] ] ], [ "::--code-active-gutter", [ "::--code-active-gutter", [ "s1t1pcq8", "--code-active-gutter:rgb(from var(--up-bright) r g b / 0.07)" ] ] ], [ "::--code-selection", [ "::--code-selection", [ "snky57a", "--code-selection:rgb(from var(--up-bright) r g b / 0.18)" ] ] ], [ "::--code-keyword", [ "::--code-keyword", [ "sbb9pzp", "--code-keyword:var(--primary)" ] ] ], [ "::--code-string", [ "::--code-string", [ "s18b2uzn", "--code-string:var(--accent)" ] ] ], [ "::--code-plain", [ "::--code-plain", [ "s8onzey", "--code-plain:var(--up-normal)" ] ] ], [ "::--code-callable", [ "::--code-callable", [ "s16k06qr", "--code-callable:var(--tint-callable)" ] ] ], [ "::--code-type", [ "::--code-type", [ "s1n2n3b1", "--code-type:var(--up-bright)" ] ] ], [ "::--code-comment", [ "::--code-comment", [ "s5j3euk", "--code-comment:var(--tint-comment)" ] ] ], [ "::--code-attr", [ "::--code-attr", [ "s14j98t0", "--code-attr:rgb(from var(--primary) r g b / 0.65)" ] ] ], [ "::--code-path", [ "::--code-path", [ "s7em04x", "--code-path:rgb(from var(--up-bright) r g b / 0.6)" ] ] ], [ "::--code-operator", [ "::--code-operator", [ "s8nt3s2", "--code-operator:rgb(from var(--up-bright) r g b / 0.72)" ] ] ], [ "::--code-error", [ "::--code-error", [ "s1dxptvb", "--code-error:var(--up-error)" ] ] ], [ "::--code-caution", [ "::--code-caution", [ "s1yauy2a", "--code-caution:var(--up-caution)" ] ] ] ]) ] ];
const shell = [ [ new Map([ [ "::min-height", [ "::min-height", [ "sondrfd", "min-height:100%" ] ] ], [ "::font-family", [ "::font-family", [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayk3oa", "font-size:14px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8cl8", "line-height:18px" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::background-color", [ "::background-color", [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ] ]) ] ];
const no_drag = [ [ new Map([ [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const nav_brand = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odkmbv", "letter-spacing:0.35em" ] ] ] ]) ] ];
const nav_mark = [ [ new Map([ [ "::display", [ "::display", [ "sowfjmu", "display:block" ] ] ], [ "::width", [ "::width", [ "s178hbq8", "width:36px" ] ] ], [ "::height", [ "::height", [ "s22x9bm", "height:18px" ] ] ], [ "::background-color", [ "::background-color", [ "syz58y5", "background-color:var(--up-bright)" ] ] ], [ "::-webkit-mask", [ "::-webkit-mask", [ "scqkrg6", "-webkit-mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ], [ "::mask", [ "::mask", [ "s11mtiwm", "mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ] ]) ] ];
const nav_link = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::transition", [ "::transition", [ "sbcnc8a", "transition:color 80ms ease" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ] ]) ] ];
const console_cap = 300;
const status = $a("Loading the compiler\u{2026}");
const diagnostics = $c([  ]);
const console_lines = $c([  ]);
const can_format = $c(false);
const can_platform = $c(false);
const mode = $a("browser");
const share_label = $a("Share");
const next_row_id = __shared_new(0);
const modified_from = $a("");
const buffer_dirty = __shared_new(false);
const run_token = __shared_new("");
const confirm_target = $a("");
const run = () => {
	if (VilanPlayground.compile(VilanPlayground.value())) {
		$g(status, "Compiling\u{2026}", [ 1 ]);
	} else {
		$g(status, "Compiler busy; queued.", [ 1 ]);
	}
	return;
};
const format = () => {
	if (!(VilanPlayground.format())) {
		$g(status, "Compiler busy; try again.", [ 1 ]);
	}
	return;
};
const share = () => {
	return VilanPlayground.share();
};
const load_example = (name) => {
	const $q = name;
	let $r = null;
	if ($q === "server") {
		$r = "node";
	} else {
		$r = "browser";
	}
	const platform = $r;
	VilanPlayground.setMode(platform);
	VilanPlayground.setDoc(VilanPlayground.example(name));
	$s(diagnostics, [  ], [ 1 ]);
	$s(console_lines, [  ], [ 1 ]);
	run();
	return;
};
const pick = (name) => {
	if (buffer_dirty.v) {
		$g(confirm_target, name, [ 1 ]);
	} else {
		load_example(name);
	}
	return;
};
const confirm_replace = () => {
	const name = $y(confirm_target);
	$g(confirm_target, "", [ 1 ]);
	if (name !== "") {
		load_example(name);
	}
	return;
};
const cancel_replace = () => {
	return $g(confirm_target, "", [ 1 ]);
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
	$g(share_label, label, [ 1 ]);
	const $z = share_revert.v;
	let $A = null;
	if ($z[0] === 0) {
		const timer = $z[1];
		$A = cancel(timer);
	} else {
		$A = undefined;
	}
	$A;
	const timer2 = after(1600);
	share_revert.v = [ 0, __clone(timer2) ];
	__task(async () => {
		if (await (wait(timer2, [ 1 ]))) {
			$g(share_label, "Share", [ 1 ]);
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
		rows.push([ id, diagnostic.severity, diagnostic.file, diagnostic.line + 1, diagnostic.column + 1, diagnostic.message, diagnostic.note, trace ]);
		id = id + 1;
	}
	next_row_id.v = id;
	$F(diagnostics, rows, [ 1 ]);
	return rows.length;
};
mount_root("app", ($L) => {
	return playground_page(status, diagnostics, console_lines, can_format, can_platform, share_label, mode, modified_from, confirm_target, run, format, share, confirm_replace, cancel_replace, [ 1 ], $L);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $bY = null;
	if (kind === "ready") {
		$bb(can_format, event.canFormat, [ 1 ]);
		$bb(can_platform, event.canPlatform, [ 1 ]);
		if (!(event.canPlatform)) {
			VilanPlayground.setMode("browser");
		}
		$g(status, "Ready (vilan " + event.version + ")", [ 1 ]);
		compiler_ready.v = true;
		run_on_arrival();
	} else if (kind === "doc") {
		doc_ready.v = true;
		run_on_arrival();
	} else if (kind === "dirty") {
		buffer_dirty.v = event.changed;
		$g(modified_from, event.name, [ 1 ]);
		if (!(event.changed)) {
			$g(confirm_target, "", [ 1 ]);
		}
		$bY = undefined;
	} else if (kind === "command") {
		const command = event.command;
		if (command === "run") {
			run();
		} else if (command === "format") {
			format();
		} else if (command === "pick") {
			pick(event.name);
		} else if (command === "mode") {
			$g(mode, event.name, [ 1 ]);
		}
		$bY = undefined;
	} else if (kind === "formatted") {
		if (event.changed) {
			$g(status, "Formatted.", [ 1 ]);
		} else {
			$g(status, "Format made no changes.", [ 1 ]);
		}
		$bY = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			$g(status, "Link copied to the clipboard.", [ 1 ]);
			flash_share("Copied!");
		} else {
			$g(status, "Link ready in the address bar.", [ 1 ]);
			flash_share("Link ready");
		}
		$bY = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $bZ = null;
		if (event.ok) {
			if (event.platform === "node") {
				$g(status, "No problems (server check, vilan " + event.version + ").", [ 1 ]);
			} else {
				$g(status, "No problems (vilan " + event.version + ").", [ 1 ]);
			}
			$bZ = undefined;
		} else if (count === 1) {
			$g(status, "1 problem; see the diagnostics.", [ 1 ]);
		} else {
			$g(status, "" + count + " problems; see the diagnostics.", [ 1 ]);
		}
		$bY = $bZ;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $ca = null;
		if (event.platform === "node") {
			if (event.ok) {
				$g(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ]);
			} else {
				$g(status, "Build failed; see the diagnostics.", [ 1 ]);
			}
			$ca = undefined;
		} else {
			$s(console_lines, [  ], [ 1 ]);
			if (event.ok) {
				$g(status, "Compiled (vilan " + event.version + ")", [ 1 ]);
				const token = crypto.randomUUID();
				run_token.v = token;
				VilanPlayground.runProgram(event.js, event.css, token);
			} else {
				$g(status, "Build failed; see the diagnostics.", [ 1 ]);
				run_token.v = "";
				VilanPlayground.clearProgram();
			}
			$ca = undefined;
		}
		$bY = $ca;
	} else if (kind === "crash") {
		$g(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $bY;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const expected = run_token.v;
	const kind = message.kind;
	if (expected !== "" && message.token === expected && (kind === "log" || kind === "error")) {
		$cb(console_lines, (lines) => {
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
