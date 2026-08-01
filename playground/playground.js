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
function dispose(self, $ab) {
	let kept = [  ];
	for (const subscriber of self[0].v) {
		if (subscriber[0] !== self[1]) {
			kept.push(subscriber);
		}
	}
	self[0].v = kept;
	const $ac = $ab;
	let $ad = null;
	if ($ac[0] === 0) {
		const turn = $ac[1];
		let kept_pending = [  ];
		for (const subscriber2 of turn[0].v) {
			if (subscriber2[0] !== self[1]) {
				kept_pending.push(subscriber2);
			}
		}
		turn[0].v = kept_pending;
		$ad = undefined;
	} else {
		$ad = undefined;
	}
	return $ad;
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
function get_owner($W) {
	return $W;
}
function view(tag) {
	let $B = null;
	if (is_svg_tag(tag)) {
		$B = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$B = [ document.createElement(tag) ];
	}
	return $B;
}
function is_svg_tag(tag) {
	const $z = tag;
	let $A = null;
	if ($z === "svg") {
		$A = true;
	} else if ($z === "path") {
		$A = true;
	} else if ($z === "circle") {
		$A = true;
	} else if ($z === "ellipse") {
		$A = true;
	} else if ($z === "rect") {
		$A = true;
	} else if ($z === "line") {
		$A = true;
	} else if ($z === "polyline") {
		$A = true;
	} else if ($z === "polygon") {
		$A = true;
	} else if ($z === "g") {
		$A = true;
	} else if ($z === "defs") {
		$A = true;
	} else if ($z === "use") {
		$A = true;
	} else if ($z === "symbol") {
		$A = true;
	} else if ($z === "marker") {
		$A = true;
	} else if ($z === "pattern") {
		$A = true;
	} else if ($z === "mask") {
		$A = true;
	} else if ($z === "clipPath") {
		$A = true;
	} else if ($z === "linearGradient") {
		$A = true;
	} else if ($z === "radialGradient") {
		$A = true;
	} else if ($z === "stop") {
		$A = true;
	} else if ($z === "text") {
		$A = true;
	} else if ($z === "tspan") {
		$A = true;
	} else if ($z === "textPath") {
		$A = true;
	} else if ($z === "filter") {
		$A = true;
	} else if ($z === "foreignObject") {
		$A = true;
	} else if ($z === "feGaussianBlur") {
		$A = true;
	} else if ($z === "feColorMatrix") {
		$A = true;
	} else if ($z === "feOffset") {
		$A = true;
	} else if ($z === "feMerge") {
		$A = true;
	} else if ($z === "feMergeNode") {
		$A = true;
	} else if ($z === "feFlood") {
		$A = true;
	} else if ($z === "feComposite") {
		$A = true;
	} else if ($z === "feBlend") {
		$A = true;
	} else if ($z === "feDropShadow") {
		$A = true;
	} else {
		$A = false;
	}
	return $A;
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
	$E(source, (value) => {
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
		return $P([ 1 ], ($O) => {
			return handler($O);
		});
	});
	return self;
}
function child(self, child2) {
	self[0].appendChild(child2[0]);
	return self;
}
function bind_text(self, source, $ah, $ai) {
	const element = __clone(self[0]);
	$aj(source, (value) => {
		element.textContent = value;
		return;
	}, $ah, $ai);
	return self;
}
function show(self, condition, $R, $S) {
	const element = __clone(self[0]);
	$T(condition, (visible) => {
		element.hidden = !(visible);
		return;
	}, $R, $S);
	return self;
}
function mount(id, view2) {
	const element = document.getElementById(id);
	element.replaceChildren();
	element.appendChild(view2[0]);
}
function mount_root(id, body) {
	const $aX = $aW([ 1 ], ($aU) => {
		return $aV(body);
	});
	const built = $aX[0];
	const root = $aX[1];
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
	for (const entry of $C(self[0])) {
		const $D = entry;
		const class2 = $D[0];
		const _declaration = $D[1];
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
	for (const key of $G(b[0])) {
		const $K = $H(b[0], key);
		let $L = null;
		if ($K[0] === 0) {
			const entry = $K[1];
			$L = $M(rules, key, entry);
		} else {
			$L = undefined;
		}
		$L;
	}
	return [ rules ];
}
function severity_tag(row) {
	const $at = row[1];
	let $au = null;
	if ($at === "error") {
		$au = text(styled(view("span"), diag_error), "error");
	} else {
		$au = text(styled(view("span"), diag_warning), "warning");
	}
	return $au;
}
function diagnostic_row(row) {
	const head = child(child(child(view("div"), severity_tag(row)), text(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " ")), text(view("span"), row[5]));
	const $av = row[6];
	let $aw = null;
	if ($av === "") {
		$aw = head;
	} else {
		$aw = child(child(view("div"), head), text(styled(view("div"), diag_note), "  note: " + row[6]));
	}
	return $aw;
}
function console_row(row) {
	const $aN = row[1];
	let $aO = null;
	if ($aN === "error") {
		$aO = text(styled(view("div"), console_error), row[2]);
	} else {
		$aO = text(view("div"), row[2]);
	}
	return $aO;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, run2, format2, pick2, $x, $y) {
	return child(child(styled(view("div"), shell), top_bar($a("1"))), child(child(child(styled(view("main"), add(wide_column, workbench)), text(styled(view("h1"), pane_label), "Playground \u{2014} vilan in the browser")), child(child(child(child(child(child(styled(view("div"), controls), on(text(styled(view("button"), run_button), "Run"), "click", ($N) => {
		return run2();
	})), show(on(text(styled(view("button"), example_button), "Format"), "click", ($Q) => {
		return format2();
	}), can_format2, $x, $y)), on(text(styled(view("button"), example_button), "Counter"), "click", ($ae) => {
		return pick2("counter");
	})), on(text(styled(view("button"), example_button), "Hello"), "click", ($af) => {
		return pick2("hello");
	})), on(text(styled(view("button"), example_button), "Styles"), "click", ($ag) => {
		return pick2("styles");
	})), bind_text(styled(view("p"), status_line), status2, $x, $y))), child(child(styled(view("div"), panes), child(child(child(child(styled(view("div"), pane), text(styled(view("p"), pane_label), "Program")), attr(styled(view("div"), editor_host), "id", "editor")), text(styled(view("p"), pane_label), "Diagnostics")), child(child(styled(view("pre"), report_pre), show(text(styled(view("div"), quiet_row), "Nothing to report."), $ak(diagnostics2, (rows) => {
		return rows.length === 0;
	}, $x), $x, $y)), $ax(view("div"), diagnostics2, (row) => {
		return row[0];
	}, (row, $as) => {
		return diagnostic_row(row);
	}, $x, $y)))), child(child(child(child(styled(view("div"), pane), text(styled(view("p"), pane_label), "Result")), attr(styled(view("div"), runner_host), "id", "runner")), text(styled(view("p"), pane_label), "Console")), child(child(styled(view("pre"), report_pre), show(text(styled(view("div"), quiet_row), "Program output lands here."), $aK(console_lines2, (rows) => {
		return rows.length === 0;
	}, $x), $x, $y)), $aP(view("div"), console_lines2, (row) => {
		return row[0];
	}, (row, $aM) => {
		return console_row(row);
	}, $x, $y))))));
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
function $C(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(entry[1]);
	}
	return result;
}
function $F(self) {
	return self[0].v;
}
function $E(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($F(self));
		return;
	} ]);
	observer($F(self));
	return [ self[1], id ];
}
function $G(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(entry[0]);
	}
	return result;
}
function $H(self, key) {
	const $I = __map_get(self[0], hash(key));
	let $J = null;
	if ($I[0] === 0) {
		const entry = $I[1];
		$J = [ 0, entry[1] ];
	} else {
		$J = [ 1 ];
	}
	return $J;
}
function $M(self, key, value) {
	self[0].set(hash(key), [ key, value ]);
}
function $P(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $Y(self) {
	return self[0].v;
}
function $X(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($Y(self));
		return;
	} ]);
	observer($Y(self));
	return [ self[1], id ];
}
function $Z(self, item, $aa) {
	self[0].v.push(() => {
		dispose(item, $aa);
		return;
	});
	return item;
}
function $T(self, observer, $U, $V) {
	$Z(get_owner($V), $X(self, observer), $U);
}
function $aj(self, observer, $U, $V) {
	$Z(get_owner($V), $E(self, observer), $U);
}
function $am(self) {
	return self[0].v;
}
function $an(self, value, $f) {
	self[0].v = value;
	const $ao = $f;
	let $ap = null;
	if ($ao[0] === 0) {
		const turn = $ao[1];
		$ap = enqueue(turn, self[1].v);
	} else {
		const $aq = $j(draining_turns.v);
		let $ar = null;
		if ($aq[0] === 0) {
			const draining = $aq[1];
			$ar = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$ar = undefined;
		}
		$ap = $ar;
	}
	return $ap;
}
function $ak(self, transform, $al) {
	const derived = $d(transform($am(self)));
	self[1].v.push([ fresh_id(), () => {
		$an(derived, transform($am(self)), $al);
		return;
	} ]);
	return derived;
}
function $aA(old_keys, old_items, items, key_of) {
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
				let $aB = null;
				if (eq(__at(old_items, index), item)) {
					$aB = [ 0, index ];
				} else {
					$aB = [ 1, index ];
				}
				step = $aB;
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
function $aF(owner, body) {
	return body(owner);
}
function $aJ(self) {
	return self[0].v;
}
function $aI(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($aJ(self));
		return;
	} ]);
	observer($aJ(self));
	return [ self[1], id ];
}
function $aH(self, observer, $U, $V) {
	$Z(get_owner($V), $aI(self, observer), $U);
}
function $ax(self, source, key, render, $ay, $az) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($az), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$aH(source, (list) => {
		const plan = $aA(row_keys.v, row_items.v, list, key);
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
			const $aC = step;
			let $aD = null;
			if ($aC[0] === 0) {
				const index2 = $aC[1];
				next_views.push(__at(previous_views, index2));
				next_owners.push(__at(previous_owners, index2));
				$aD = undefined;
			} else if ($aC[0] === 1) {
				const index3 = $aC[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($aF(owner, ($aE) => {
					return render(item, $aE);
				}));
				next_owners.push(owner);
				$aD = undefined;
			} else {
				const owner2 = new3();
				next_views.push($aF(owner2, ($aG) => {
					return render(item, $aG);
				}));
				next_owners.push(owner2);
				$aD = undefined;
			}
			$aD;
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
	}, $ay, $az);
	return self;
}
function $aL(self) {
	return self[0].v;
}
function $aK(self, transform, $al) {
	const derived = $d(transform($aL(self)));
	self[1].v.push([ fresh_id(), () => {
		$an(derived, transform($aL(self)), $al);
		return;
	} ]);
	return derived;
}
function $aQ(old_keys, old_items, items, key_of) {
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
				let $aR = null;
				if (eq2(__at(old_items, index), item)) {
					$aR = [ 0, index ];
				} else {
					$aR = [ 1, index ];
				}
				step = $aR;
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
function $aP(self, source, key, render, $ay, $az) {
	const element = __clone(self[0]);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_views = __shared_new([  ]);
	const row_owners = __shared_new([  ]);
	defer(get_owner($az), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		return;
	});
	$aH(source, (list) => {
		const plan = $aQ(row_keys.v, row_items.v, list, key);
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
			const $aS = step;
			let $aT = null;
			if ($aS[0] === 0) {
				const index2 = $aS[1];
				next_views.push(__at(previous_views, index2));
				next_owners.push(__at(previous_owners, index2));
				$aT = undefined;
			} else if ($aS[0] === 1) {
				const index3 = $aS[1];
				dispose2(__at(previous_owners, index3));
				__at(previous_views, index3)[0].remove();
				const owner = new3();
				next_views.push($aF(owner, ($aE) => {
					return render(item, $aE);
				}));
				next_owners.push(owner);
				$aT = undefined;
			} else {
				const owner2 = new3();
				next_views.push($aF(owner2, ($aG) => {
					return render(item, $aG);
				}));
				next_owners.push(owner2);
				$aT = undefined;
			}
			$aT;
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
	}, $ay, $az);
	return self;
}
function $aV(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, scope ];
}
function $aW(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $aZ(self, value, $f) {
	self[0].v = value;
	const $ba = $f;
	let $bb = null;
	if ($ba[0] === 0) {
		const turn = $ba[1];
		$bb = enqueue(turn, self[1].v);
	} else {
		const $bc = $j(draining_turns.v);
		let $bd = null;
		if ($bc[0] === 0) {
			const draining = $bc[1];
			$bd = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bd = undefined;
		}
		$bb = $bd;
	}
	return $bb;
}
function $be(self, value, $f) {
	self[0].v = value;
	const $bf = $f;
	let $bg = null;
	if ($bf[0] === 0) {
		const turn = $bf[1];
		$bg = enqueue(turn, self[1].v);
	} else {
		const $bh = $j(draining_turns.v);
		let $bi = null;
		if ($bh[0] === 0) {
			const draining = $bh[1];
			$bi = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bi = undefined;
		}
		$bg = $bi;
	}
	return $bg;
}
function $bl(self) {
	return self[0].v;
}
function $bm(self, value, $f) {
	self[0].v = value;
	const $bn = $f;
	let $bo = null;
	if ($bn[0] === 0) {
		const turn = $bn[1];
		$bo = enqueue(turn, self[1].v);
	} else {
		const $bp = $j(draining_turns.v);
		let $bq = null;
		if ($bp[0] === 0) {
			const draining = $bp[1];
			$bq = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$bq = undefined;
		}
		$bo = $bq;
	}
	return $bo;
}
function $bj(self, transform, $bk) {
	$bm(self, transform($bl(self)), $bk);
}
const next_subscriber_id = __shared_new(0);
const draining_turns = __shared_new([  ]);
const wide_column = [ [ new Map([ [ "::max-width", [ "::max-width", [ "s1eewcz2", "max-width:1880px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vtg8d6", "padding-left:32px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t4hls", "padding-right:32px" ] ] ] ]) ] ];
const workbench = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxs0", "padding-top:var(--space-6)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyn8", "padding-bottom:var(--space-6)" ] ] ] ]) ] ];
const panes = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "1024px::flex-direction", [ "1024px::flex-direction", [ "s1a4afps", "flex-direction:row" ] ] ] ]) ] ];
const pane = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ], [ "::flex", [ "::flex", [ "s4sfhb", "flex:1 1 0" ] ] ] ]) ] ];
const pane_label = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4et", "opacity:0.6" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odj214", "letter-spacing:0.14em" ] ] ], [ "::text-transform", [ "::text-transform", [ "s1s2tj83", "text-transform:uppercase" ] ] ] ]) ] ];
const editor_host = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9sl", "border-radius:var(--space-3)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::height", [ "::height", [ "s1wqfokf", "height:420px" ] ] ] ]) ] ];
const runner_host = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9sl", "border-radius:var(--space-3)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::height", [ "::height", [ "s1wqfokf", "height:420px" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ] ]) ] ];
const controls = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ] ]) ] ];
const run_button = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1qm4s0m", "background-color:#EB682E" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9ro", "border-radius:var(--space-2)" ] ] ], [ "::padding", [ "::padding", [ "s1d0a46f", "padding:8px 20px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::font-size", [ "::font-size", [ "sayk3oa", "font-size:14px" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "szyotuk", "opacity:0.9" ] ] ] ]) ] ];
const example_button = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9ro", "border-radius:var(--space-2)" ] ] ], [ "::padding", [ "::padding", [ "s1ihgui1", "padding:7px 14px" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::font-family", [ "::font-family", [ "s19qv9u6", "font-family:inherit" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "srapg3a", "opacity:1" ] ] ] ]) ] ];
const status_line = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4eu", "opacity:0.7" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ] ]) ] ];
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
const next_row_id = __shared_new(0);
const run = () => {
	if (VilanPlayground.compile(VilanPlayground.value())) {
		$e(status, "Compiling\u{2026}", [ 1 ]);
	} else {
		$e(status, "Compiler busy \u{2014} queued.", [ 1 ]);
	}
	return;
};
const format = () => {
	if (!(VilanPlayground.format())) {
		$e(status, "Compiler busy \u{2014} try again.", [ 1 ]);
	}
	return;
};
const pick = (name) => {
	VilanPlayground.setDoc(VilanPlayground.example(name));
	$m(diagnostics, [  ], [ 1 ]);
	$r(console_lines, [  ], [ 1 ]);
	VilanPlayground.clearProgram();
	return;
};
mount_root("app", ($w) => {
	return playground_page(status, diagnostics, console_lines, can_format, run, format, pick, [ 1 ], $w);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $aY = null;
	if (kind === "ready") {
		$an(can_format, event.canFormat, [ 1 ]);
		$e(status, "Ready \u{2014} vilan " + event.version, [ 1 ]);
	} else if (kind === "formatted") {
		if (event.changed) {
			$e(status, "Formatted.", [ 1 ]);
		} else {
			$e(status, "Format made no changes.", [ 1 ]);
		}
		$aY = undefined;
	} else if (kind === "result") {
		let rows = [  ];
		let id = next_row_id.v;
		for (const diagnostic of event.diagnostics) {
			rows.push([ id, diagnostic.severity, diagnostic.file, diagnostic.line + 1, diagnostic.column + 1, diagnostic.message, diagnostic.note ]);
			id = id + 1;
		}
		next_row_id.v = id;
		$aZ(diagnostics, rows, [ 1 ]);
		$be(console_lines, [  ], [ 1 ]);
		if (event.ok) {
			$e(status, "Compiled \u{2014} vilan " + event.version, [ 1 ]);
			VilanPlayground.runProgram(event.js, event.css);
		} else {
			$e(status, "Build failed; see the diagnostics.", [ 1 ]);
			VilanPlayground.clearProgram();
		}
		$aY = undefined;
	} else if (kind === "crash") {
		$e(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $aY;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const kind = message.kind;
	if (kind === "log" || kind === "error") {
		$bj(console_lines, (lines) => {
			let next = __clone(lines);
			if (next.length < console_cap) {
				const id = next_row_id.v;
				next_row_id.v = id + 1;
				next.push([ id, kind, message.text ]);
			} else if (next.length === console_cap) {
				const id2 = next_row_id.v;
				next_row_id.v = id2 + 1;
				next.push([ id2, "error", "\u{2014} output truncated \u{2014}" ]);
			}
			return next;
		}, [ 1 ]);
	}
	return;
});
