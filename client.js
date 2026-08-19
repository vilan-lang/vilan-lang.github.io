function __at(list, index) {
	if (index >= 0 && index < list.length) return list[index];
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
		while (!($ak(turn[0].v)) && budget > 0) {
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
function dispose(self, $B) {
	let kept = [  ];
	for (const subscriber of self[0].v) {
		if (subscriber[0] !== self[1]) {
			kept.push(__clone(subscriber));
		}
	}
	self[0].v = kept;
	const $C = $B;
	let $D = null;
	if ($C[0] === 0) {
		const turn = $C[1];
		let kept_pending = [  ];
		for (const subscriber2 of turn[0].v) {
			if (subscriber2[0] !== self[1]) {
				kept_pending.push(__clone(subscriber2));
			}
		}
		turn[0].v = kept_pending;
		$D = undefined;
	} else {
		$D = undefined;
	}
	return $D;
}
function new3() {
	return [ __shared_new([  ]) ];
}
function dispose2(self) {
	for (const cleanup of self[0].v) {
		cleanup();
	}
	self[0].v = [  ];
}
function get_owner($w) {
	return $w;
}
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $aq) {
	return await (self[0].wait(ambient_signal($aq)));
}
function cancel(self) {
	self[0].cancel();
}
function ambient_signal($ar) {
	const $as = $ar;
	let $at = null;
	if ($as[0] === 0) {
		const n = $as[1];
		$at = [ 0, n.signal_of() ];
	} else {
		$at = [ 1 ];
	}
	return $at;
}
function view(tag) {
	let $h = null;
	if (is_svg_tag(tag)) {
		$h = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$h = [ document.createElement(tag) ];
	}
	return $h;
}
function is_svg_tag(tag) {
	const $f = tag;
	let $g = null;
	if ($f === "svg") {
		$g = true;
	} else if ($f === "path") {
		$g = true;
	} else if ($f === "circle") {
		$g = true;
	} else if ($f === "ellipse") {
		$g = true;
	} else if ($f === "rect") {
		$g = true;
	} else if ($f === "line") {
		$g = true;
	} else if ($f === "polyline") {
		$g = true;
	} else if ($f === "polygon") {
		$g = true;
	} else if ($f === "g") {
		$g = true;
	} else if ($f === "defs") {
		$g = true;
	} else if ($f === "use") {
		$g = true;
	} else if ($f === "symbol") {
		$g = true;
	} else if ($f === "marker") {
		$g = true;
	} else if ($f === "pattern") {
		$g = true;
	} else if ($f === "mask") {
		$g = true;
	} else if ($f === "clipPath") {
		$g = true;
	} else if ($f === "linearGradient") {
		$g = true;
	} else if ($f === "radialGradient") {
		$g = true;
	} else if ($f === "stop") {
		$g = true;
	} else if ($f === "text") {
		$g = true;
	} else if ($f === "tspan") {
		$g = true;
	} else if ($f === "textPath") {
		$g = true;
	} else if ($f === "filter") {
		$g = true;
	} else if ($f === "foreignObject") {
		$g = true;
	} else if ($f === "feGaussianBlur") {
		$g = true;
	} else if ($f === "feColorMatrix") {
		$g = true;
	} else if ($f === "feOffset") {
		$g = true;
	} else if ($f === "feMerge") {
		$g = true;
	} else if ($f === "feMergeNode") {
		$g = true;
	} else if ($f === "feFlood") {
		$g = true;
	} else if ($f === "feComposite") {
		$g = true;
	} else if ($f === "feBlend") {
		$g = true;
	} else if ($f === "feDropShadow") {
		$g = true;
	} else {
		$g = false;
	}
	return $g;
}
function text(self, content) {
	self[0].textContent = content;
	return __clone(self);
}
function styled(self, style) {
	self[0].setAttribute("class", class_list(style));
	return __clone(self);
}
function style_var(self, name, source, $r, $s) {
	const element = __clone(self[0]);
	$t(source, (value) => {
		element.style.setProperty(name, value);
		return;
	}, $r, $s);
	return __clone(self);
}
function on(self, event, handler) {
	self[0].addEventListener(event, () => {
		return $av([ 1 ], ($au) => {
			return handler($au);
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
function bind_text(self, source, $aT, $aU) {
	const element = __clone(self[0]);
	$t(source, (value) => {
		element.textContent = value;
		return;
	}, $aT, $aU);
	return __clone(self);
}
function bind_attr(self, name, source, $aw, $ax) {
	const element = __clone(self[0]);
	$t(source, (value) => {
		element.setAttribute(name, value);
		return;
	}, $aw, $ax);
	return __clone(self);
}
function place(self, parent) {
	parent[0].appendChild(self[0]);
}
function place2(self, parent) {
	parent[0].appendChild(document.createTextNode(self));
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
	const $K = property;
	let $L = null;
	if ($K === "padding") {
		$L = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($K === "margin") {
		$L = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($K === "inset") {
		$L = ";top;right;bottom;left;";
	} else if ($K === "flex") {
		$L = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($K === "background") {
		$L = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($K === "border") {
		$L = border_longhands();
	} else {
		$L = "";
	}
	return $L;
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
	for (const key of $E(rules)) {
		const parts = key.split(":");
		if (__at(parts, 0) === media && __at(parts, 1) === condition && longhands.includes(";" + __at(parts, 2) + ";")) {
			$M(out, key);
		}
	}
	return out;
}
function class_list(self) {
	let out = "";
	for (const entry of $i(self[0])) {
		const $j = entry;
		const class2 = $j[0];
		const _declaration = $j[1];
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
	for (const key of $E(b[0])) {
		const $I = $F(b[0], key);
		let $J = null;
		if ($I[0] === 0) {
			const entry = $I[1];
			const parts = key.split(":");
			rules = without_covered(rules, __at(parts, 0), __at(parts, 1), __at(parts, 2));
			$N(rules, key, entry);
			$J = undefined;
		} else {
			$J = undefined;
		}
		$J;
	}
	return [ __clone(rules) ];
}
function page(scroll_fade2, copy, $c, $d, $e) {
	return $m($m($m($m($m($m($m($m($m($m($m($m($m($m($m($m($m($m(styled(view("div"), shell), bloom($c, $d), $c, $d), top_bar(scroll_fade2, $c, $d), $c, $d), masthead($c, $d), $c, $d), divider($c, $d), $c, $d), install_section(copy, $c, $d, $e), $c, $d), divider($c, $d), $c, $d), showcase_reactive($c, $d), $c, $d), divider($c, $d), $c, $d), showcase_fullstack($c, $d), $c, $d), divider($c, $d), $c, $d), showcase_compiler($c, $d), $c, $d), divider($c, $d), $c, $d), editor_band($c, $d), $c, $d), divider($c, $d), $c, $d), feature_grid($c, $d), $c, $d), divider($c, $d), $c, $d), dogfood($c, $d), $c, $d), page_footer($c, $d), $c, $d);
}
function install_row(label, command, copy, $aa, $ab, $ac) {
	const icon = $a("" + assets + "/icons/copy.svg");
	const pending = __shared_new([ 1 ]);
	return $m($m(view("div"), text(styled(view("p"), install_label), label), $aa, $ab), $m($m(styled(view("div"), install_command), text(styled(view("span"), install_command_text), command), $aa, $ab), $m(on($O(styled(view("button"), copy_button), "aria-label", "Copy command", $aa, $ab), "click", ($ad) => {
		copy(command);
		$ae(icon, "" + assets + "/icons/check.svg", [ 0, $ad ]);
		const $ao = pending.v;
		let $ap = null;
		if ($ao[0] === 0) {
			const timer = $ao[1];
			$ap = cancel(timer);
		} else {
			$ap = undefined;
		}
		$ap;
		const timer2 = after(2400);
		pending.v = [ 0, __clone(timer2) ];
		__task(async () => {
			if (await (wait(timer2, $ac))) {
				$ae(icon, "" + assets + "/icons/copy.svg", [ 0, $ad ]);
			}
			return;
		}, "install_row");
		return;
	}), bind_attr($O(styled(view("img"), copy_icon), "alt", "", $aa, $ab), "src", icon, $aa, $ab), $aa, $ab), $aa, $ab), $aa, $ab);
}
function install_section(copy, $X, $Y, $Z) {
	return $m($m($m(styled($O(view("section"), "id", "install", $X, $Y), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "One command, the whole toolchain"), $X, $Y), $m($m($m(styled(view("p"), lead), pt("The compiler, dev server with hot reload, formatter, test runner, and language server live in one small binary. There is nothing else to install and nothing to configure. Update any time with "), $X, $Y), leaf("vilan upgrade"), $X, $Y), pt("."), $X, $Y), $X, $Y), $m($m(styled(view("div"), install_split), $m($m($m(styled(view("div"), install_grid), install_row("macOS / Linux", "curl -fsSL https://github.com/vilan-lang/vilan/releases/latest/download/install.sh | sh", copy, $X, $Y, $Z), $X, $Y), install_row("Windows (PowerShell)", "irm https://github.com/vilan-lang/vilan/releases/latest/download/install.ps1 | iex", copy, $X, $Y, $Z), $X, $Y), install_row("Homebrew", "brew install vilan-lang/vilan/vilan", copy, $X, $Y, $Z), $X, $Y), $X, $Y), $m(styled(view("div"), install_art_cell), toolchain_art($X, $Y), $X, $Y), $X, $Y), $X, $Y);
}
function showcase(prose, code, $aV, $aW) {
	return $m($m(styled(view("div"), showcase_grid), prose, $aV, $aW), code, $aV, $aW);
}
function showcase_flipped(code, prose, $bp, $bq) {
	return $m($m(styled(view("div"), showcase_grid_flipped), code, $bp, $bq), prose, $bp, $bq);
}
function counter_demo($aE, $aF) {
	const count = $aG(0);
	return $m($m(styled(view("div"), demo_box), on(text(styled(view("button"), demo_button), "+1"), "click", ($aH) => {
		return $aI(count, (n) => {
			return n + 1;
		}, [ 0, $aH ]);
	}), $aE, $aF), bind_text(styled(view("p"), demo_label), $aR(count, (n) => {
		return "clicked " + n + " times";
	}, $aE), $aE, $aF), $aE, $aF);
}
function showcase_reactive($aC, $aD) {
	return $m($m(styled(view("section"), add(add(column, section_block), stack)), showcase($m($m($m($m(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "UI that follows your data"), $aC, $aD), $m($m($m(styled(view("p"), lead), pt("A view is a value and a binding is a subscription: "), $aC, $aD), leaf("bind_text"), $aC, $aD), pt(" sets the text node once, then sets it again whenever the signal changes. There is no virtual DOM, no render loop, and no dependency array to babysit. Updates land exactly where the data changed."), $aC, $aD), $aC, $aD), text(styled(view("p"), lead), "The snippet is the whole program, and it runs. Try it right here:"), $aC, $aD), counter_demo($aC, $aD), $aC, $aD), code_panel([ ln([ kw("import"), t(" std::ui::{ view, mount_root };") ]), ln([ kw("import"), t(" std::reactive::"), ty("Signal"), t(";") ]), blank(), ln([ kw("fun"), t(" "), fn("main"), t("() {") ]), ln([ t("    "), kw("let"), t(" count = "), ty("Signal"), t("::"), fn("new"), t("("), st("0"), t(");") ]), ln([ t("    "), kw("let"), t(" _root = "), fn("mount_root"), t("("), st("\"app\""), t(", || {") ]), ln([ t("        "), fn("view"), t("("), st("\"div\""), t(")") ]), ln([ t("            ."), fn("child"), t("("), fn("view"), t("("), st("\"p\""), t(")."), fn("bind_text"), t("(count."), fn("map"), t("(|n: i32| "), st("i\"clicked "), hl("{"), t("n"), hl("}"), st(" times\""), t(")))") ]), ln([ t("            ."), fn("child"), t("("), fn("view"), t("("), st("\"button\""), t(")."), fn("text"), t("("), st("\"+1\""), t(")."), fn("on"), t("("), st("\"click\""), t(", || count."), fn("set_with"), t("(|n| n + "), st("1"), t(")))") ]), ln([ t("    });") ]), ln([ t("}") ]) ]), $aC, $aD), $aC, $aD), dataflow_art($aC, $aD), $aC, $aD);
}
function showcase_fullstack($be, $bf) {
	return $m($m($m($m(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "The server is a struct. The client is generated."), $be, $bf), $m($m($m($m($m(styled(view("p"), lead), pt("Mark a method "), $be, $bf), leaf_link("/docs/guide/services.html#what-rpc-calls-do", "[rpc]", $be, $bf), $be, $bf), pt(" and the browser can call it like any other function, typed and checked. Mark a signal "), $be, $bf), leaf_link("/docs/guide/services.html#mirrors", "[expose]", $be, $bf), $be, $bf), pt(" and every connected client holds a live mirror that updates when the server writes. You never write REST endpoints, fetch calls, or the JSON shapes that drift out of sync between them."), $be, $bf), $be, $bf), diagram($be, $bf), $be, $bf), button_link("/docs/guide/services.html", "Services & RPC in the guide", $be, $bf), $be, $bf);
}
function showcase_compiler($bn, $bo) {
	return $m(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped($m($m(styled(view("div"), diag_stack), code_panel([ ln([ kw("import"), t(" std::print;") ]), ln([ kw("import"), t(" std::option::"), ty("Option"), t("::{ self, "), ty("Some"), t(", "), ty("None"), t(" };") ]), ln([ kw("fun"), t(" "), fn("find_user"), t("(id: i32): "), ty("Option"), t("<str> {") ]), ln([ t("    "), kw("if"), t(" id == "), st("1"), t(" { "), ty("Some"), t("("), st("\"Ada\""), t(") } "), kw("else"), t(" { "), ty("None"), t(" }") ]), ln([ t("}") ]), ln([ kw("fun"), t(" "), fn("greet"), t("(name: str): str {") ]), ln([ t("    "), st("i\"hello "), hl("{"), t("name"), hl("}"), st("\"") ]), ln([ t("}") ]), ln([ kw("fun"), t(" "), fn("main"), t("() {") ]), ln([ t("    "), fn("print"), t("("), fn("greet"), t("("), fn("find_user"), t("("), st("2"), t(")));") ]), ln([ t("}") ]) ]), $bn, $bo), $m($m($m($m($m($m($m(styled(view("pre"), diag_pre), ln([ text(styled(view("span"), diag_error), "Error:"), t(" Expected str, but got Option<str> instead.") ]), $bn, $bo), ln([ text(styled(view("span"), diag_frame), "    \u{256d}\u{2500}[ demo.vl:10:14 ]") ]), $bn, $bo), ln([ text(styled(view("span"), diag_frame), "    \u{2502}") ]), $bn, $bo), ln([ text(styled(view("span"), diag_frame), " 10 \u{2502}     print(greet(find_user(2)));") ]), $bn, $bo), ln([ text(styled(view("span"), diag_frame), "    \u{2502}                 \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{252c}\u{2500}\u{2500}\u{2500}\u{2500}") ]), $bn, $bo), ln([ text(styled(view("span"), diag_frame), "    \u{2502}                       \u{2570}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500} Expected str, but got Option<str> instead.") ]), $bn, $bo), ln([ text(styled(view("span"), diag_frame), "\u{2500}\u{2500}\u{2500}\u{2500}\u{256f}") ]), $bn, $bo), $bn, $bo), $m($m($m($m(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "Find out at compile time"), $bn, $bo), $m($m($m($m($m(styled(view("p"), lead), pt("Vilan has no null and no exceptions. A value that might be missing is an "), $bn, $bo), leaf_link("/docs/std/option-result.html#optiont", "Option", $bn, $bo), $bn, $bo), pt(", a call that might fail returns a "), $bn, $bo), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $bn, $bo), $bn, $bo), pt(", and the compiler makes you look inside before you use either. The mistake in this snippet is a build error, not a production incident."), $bn, $bo), $bn, $bo), text(styled(view("p"), lead), "Values are copied rather than silently shared, so two names never fight over one object. Most of the mistakes JavaScript saves for runtime cannot even be written."), $bn, $bo), button_link("/docs/std/option-result.html", "Option & Result in the reference", $bn, $bo), $bn, $bo), $bn, $bo), $bn, $bo);
}
function editor_band($br, $bs) {
	return $m(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped(editor_art($br, $bs), $m($m($m($m(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "The editor is in on it"), $br, $bs), $m($m($m($m(styled(view("p"), lead), leaf("vilan"), $br, $bs), pt(" and "), $br, $bs), leaf("vilan-lsp"), $br, $bs), pt(" ship together so your editor and build never disagree. In-editor diagnostics, hover types and docs, autocompletion, Symbol Rename, formatting, and Organize Imports are all available in VS Code today."), $br, $bs), $br, $bs), text(styled(view("p"), lead), "One broken line does not take the tooling down. The rest of the file keeps compiling, serving hovers, and completing while you fix it."), $br, $bs), button_link("https://github.com/vilan-lang/vilan/tree/main/editors/vscode", "The VS Code extension", $br, $bs), $br, $bs), $br, $bs), $br, $bs);
}
function button_link(href, label, $bl, $bm) {
	return $m($m($O(styled(view("a"), button_link_style), "href", href, $bl, $bm), pt(label), $bl, $bm), $O($O(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $bl, $bm), "alt", "", $bl, $bm), $bl, $bm);
}
function docs_link(href, label, $bz, $bA) {
	return $m($m($O(styled(view("a"), card_link), "href", href, $bz, $bA), pt(label), $bz, $bA), $O($O(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $bz, $bA), "alt", "", $bz, $bA), $bz, $bA);
}
function feature(icon, name, href, body, $bx, $by) {
	return $m($m($m($m(styled(view("article"), card), $O($O(styled(view("img"), card_icon), "src", "" + assets + "/icons/" + icon + ".svg", $bx, $by), "alt", "", $bx, $by), $bx, $by), text(styled(view("h3"), card_title), name), $bx, $by), children(styled(view("p"), card_body), body), $bx, $by), docs_link(href, "docs", $bx, $by), $bx, $by);
}
function feature_grid($bv, $bw) {
	return $m($m(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "Built into the language"), $bv, $bw), $m($m($m($m($m($m($O(styled(view("div"), cards_grid), "data-glow", "", $bv, $bw), feature("shield-check", "No null, no exceptions", "/docs/std/option-result.html", [ pt("A missing value is an "), leaf_link("/docs/std/option-result.html#optiont", "Option", $bv, $bw), pt(", a failure is a "), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $bv, $bw), pt(", and "), leaf("match"), pt(" makes you handle both arms. Errors are ordinary values you pass around like any other data.") ], $bv, $bw), $bv, $bw), feature("copy", "Values, not references", "/docs/tour/memory-model.html", [ pt("Assignment copies. Sharing is explicit, borrowing is checked, and spooky action at a distance is a compile error.") ], $bv, $bw), $bv, $bw), feature("zap", "Async without the ceremony", "/docs/tour/async.html", [ leaf_link("/docs/tour/async.html#opting-out-of-waiting-async-and-await", "await", $bv, $bw), pt(" is implicit. Call an async function and the machinery is the compiler\'s problem. When you want real concurrency, tasks and "), leaf_link("/docs/tour/async.html#nurseries-structured-spawning", "nurseries", $bv, $bw), pt(" give it structure.") ], $bv, $bw), $bv, $bw), feature("layers", "One program, two platforms", "/docs/tour/platforms.html", [ pt("One workspace compiles the node server and the browser client. The compiler tracks which code needs which platform and keeps each bundle honest.") ], $bv, $bw), $bv, $bw), feature("server", "Rendered before it ships", "/docs/guide/ssr.html", [ leaf("std::ui"), pt(" renders on the server too: first paint is real markup, then the client rebuilds it live. View source on this page and the content is already there.") ], $bv, $bw), $bv, $bw), feature("refresh-cw", "A dev loop that keeps up", "/docs/guide/dev-loop.html", [ leaf("vilan run . --watch"), pt(" rebuilds in milliseconds and hot-reloads the browser. Format, test, and language server ship in the same binary.") ], $bv, $bw), $bv, $bw), $bv, $bw);
}
function dogfood($bB, $bC) {
	return $m($m($m(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("p"), dogfood_text), "This site is a vilan program: one package, three entries \u{2014} this page, the playground, and the server that renders both. The server rendered the markup you first saw, and the browser rebuilt it live."), $bB, $bC), text(styled(view("p"), dogfood_text), "Vilan is built to last. Semantics are settled on paper before they are implemented, and pinned by tests after. A language is a foundation, and a foundation should not move under you."), $bB, $bC), $m(styled(view("p"), dogfood_cta), docs_link("https://github.com/vilan-lang/website", "Read this page\'s source", $bB, $bC), $bB, $bC), $bB, $bC);
}
function footer_column(title, links, $bF, $bG) {
	return $m($m(view("div"), text(styled(view("p"), footer_head), title), $bF, $bG), children(styled(view("div"), footer_list), links), $bF, $bG);
}
function page_footer($bD, $bE) {
	return $m($m(styled(view("footer"), footer_block), $m($m($m($m(styled(view("div"), add(column, footer_grid)), styled($O($O($O(view("img"), "src", "" + assets + "/footer_mark.webp", $bD, $bE), "alt", "The vilan mark", $bD, $bE), "width", "200", $bD, $bE), footer_mark), $bD, $bE), footer_column("Using Vilan", [ text($O(styled(view("a"), footer_link), "href", "#install", $bD, $bE), "Install"), text($O(styled(view("a"), footer_link), "href", "/docs/tour/hello-vilan.html", $bD, $bE), "Learn"), text($O(styled(view("a"), footer_link), "href", "/playground", $bD, $bE), "Playground"), text($O(styled(view("a"), footer_link), "href", "/docs/", $bD, $bE), "Documentation") ], $bD, $bE), $bD, $bE), footer_column("Community", [ text($O(styled(view("a"), footer_link), "href", "" + repo + "/issues", $bD, $bE), "Issues"), text($O(styled(view("a"), footer_link), "href", "" + repo + "/discussions", $bD, $bE), "Discussions"), text($O(styled(view("a"), footer_link), "href", "https://github.com/vilan-lang", $bD, $bE), "GitHub") ], $bD, $bE), $bD, $bE), footer_column("Terms & policies", [ text($O(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/CODE_OF_CONDUCT.md", $bD, $bE), "Code of Conduct"), text($O(styled(view("a"), footer_link), "href", "" + repo + "#license", $bD, $bE), "Licenses"), text($O(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/assets/branding/LICENSE", $bD, $bE), "Logo Policy") ], $bD, $bE), $bD, $bE), $bD, $bE), $m(styled(view("div"), column), $m($m(styled(view("div"), footer_micro), text(view("span"), "\u{a9} 2026 Reed Syllas"), $bD, $bE), text(view("span"), "MIT or Apache-2.0"), $bD, $bE), $bD, $bE), $bD, $bE);
}
function diagram($bi, $bj) {
	return $m($m($m($m($m($m($m($m(styled(view("div"), art_stage), styled(view("div"), dg_blob_top), $bi, $bj), styled(view("div"), dg_blob_left), $bi, $bj), styled(view("div"), dg_blob_right), $bi, $bj), grain(), $bi, $bj), $m($m(styled(view("div"), dg_source), $bk(styled(view("p"), art_tab), "notes.vl \u{b7} one source", $bi, $bj), $bi, $bj), $m($m($m($m($m($m($m($m($m(styled(view("div"), art_code), ln([ t("["), kw("service"), t("(NotesClient)]") ]), $bi, $bj), ln([ kw("struct"), t(" Notes {") ]), $bi, $bj), ln([ t("    ["), kw("expose"), t("] entries: Signal<List<Note>>,") ]), $bi, $bj), ln([ t("}") ]), $bi, $bj), blank(), $bi, $bj), ln([ kw("impl"), t(" Notes {") ]), $bi, $bj), ln([ t("    ["), kw("rpc"), t("]") ]), $bi, $bj), ln([ t("    "), kw("fun"), t(" add(self, text: str): i32 { \u{2026} }") ]), $bi, $bj), ln([ t("}") ]), $bi, $bj), $bi, $bj), $bi, $bj), $m($m($m($m(styled(view("div"), dg_wire_zone), styled(view("div"), dg_wire_left), $bi, $bj), styled(view("div"), dg_wire_right), $bi, $bj), $bk(styled(view("span"), dg_wire_label_left), "vilan build", $bi, $bj), $bi, $bj), $bk(styled(view("span"), dg_wire_label_right), "vilan build", $bi, $bj), $bi, $bj), $bi, $bj), $m($m($m(styled(view("div"), dg_legs), $m($m(styled(view("div"), art_card), $m($m($m(styled(view("div"), dg_leg_head), styled(view("div"), dot_magenta), $bi, $bj), $bk(styled(view("span"), dg_leg_name), "the server", $bi, $bj), $bi, $bj), $bk(styled(view("span"), dg_leg_env), "node", $bi, $bj), $bi, $bj), $bi, $bj), $m($m(styled(view("div"), art_code), ln([ t("serve_service(4000,") ]), $bi, $bj), ln([ t("    notes.dispatcher() \u{2026})") ]), $bi, $bj), $bi, $bj), $bi, $bj), $m($m(styled(view("div"), dg_mid), $m($m(view("div"), $bk(styled(view("p"), dg_mid_label), "notes.add(\"ship it\")", $bi, $bj), $bi, $bj), $m($m(styled(view("div"), dg_line_row), styled(view("div"), arrow_head_left), $bi, $bj), styled(view("div"), dg_line), $bi, $bj), $bi, $bj), $bi, $bj), $m($m($m(view("div"), $m($m(styled(view("div"), dg_line_row), styled(view("div"), dg_line_dashed), $bi, $bj), styled(view("div"), arrow_head_right_rose), $bi, $bj), $bi, $bj), $bk(styled(view("p"), dg_mid_label_rose), "entries", $bi, $bj), $bi, $bj), $bk(styled(view("p"), dg_note), "mirrored live", $bi, $bj), $bi, $bj), $bi, $bj), $bi, $bj), $m($m(styled(view("div"), art_card), $m($m($m(styled(view("div"), dg_leg_head), styled(view("div"), dot_orange), $bi, $bj), $bk(styled(view("span"), dg_leg_name), "the client", $bi, $bj), $bi, $bj), $bk(styled(view("span"), dg_leg_env), "browser", $bi, $bj), $bi, $bj), $bi, $bj), $m($m(styled(view("div"), art_code), ln([ kw("let"), t(" notes = NotesClient::connect("), st("\"/rpc\""), t(");") ]), $bi, $bj), ln([ t("notes.entries "), t("// Signal, live") ]), $bi, $bj), $bi, $bj), $bi, $bj), $bi, $bj), $bk(styled(view("p"), art_caption), "one definition: the compiler builds both sides and keeps them honest", $bi, $bj), $bi, $bj);
}
function editor_art($bt, $bu) {
	return $m($m($m($m(styled(view("div"), art_stage), styled(view("div"), ed_blob_a), $bt, $bu), styled(view("div"), ed_blob_b), $bt, $bu), grain(), $bt, $bu), $m($m($m($m(styled(view("div"), ed_window), $m($m($m($m(styled(view("div"), ed_titlebar), styled(view("div"), ed_dot_red), $bt, $bu), styled(view("div"), ed_dot_orange), $bt, $bu), styled(view("div"), ed_dot_magenta), $bt, $bu), text(styled(view("span"), ed_title), "app.vl \u{2014} vilan"), $bt, $bu), $bt, $bu), $m($m(styled(view("div"), ed_body), text(styled(view("div"), ed_gutter), "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"), $bt, $bu), $m($m($m($m($m($m($m($m($m($m($m(styled(view("div"), ed_code), ln([ kw("import"), t(" std::print;") ]), $bt, $bu), ln([ kw("import"), t(" std::option::Option::{ self, Some, None };") ]), $bt, $bu), ln([ kw("fun"), t(" find_user(id: i32): Option<str> {") ]), $bt, $bu), ln([ t("    "), kw("if"), t(" id == 1 { Some("), st("\"Ada\""), t(") } "), kw("else"), t(" { None }") ]), $bt, $bu), ln([ t("}") ]), $bt, $bu), ln([ kw("fun"), t(" greet(name: str): str {") ]), $bt, $bu), ln([ t("    "), st("i\"hello {name}\"") ]), $bt, $bu), ln([ t("}") ]), $bt, $bu), ln([ kw("fun"), t(" main() {") ]), $bt, $bu), ln([ t("    print(greet("), text(styled(view("span"), ed_squiggle), "find_user(2)"), t("));"), styled(view("span"), ed_caret) ]), $bt, $bu), ln([ t("}") ]), $bt, $bu), $bt, $bu), $bt, $bu), $m($m($m(styled(view("div"), ed_statusbar), text(styled(view("span"), ed_problem), "\u{2297} 1"), $bt, $bu), text(view("span"), "vilan-lsp"), $bt, $bu), text(styled(view("span"), ed_status_right), "Ln 10, Col 17 \u{b7} app.vl"), $bt, $bu), $bt, $bu), $m($m(styled(view("div"), ed_hover), text(styled(view("div"), ed_hover_error), "Expected str, but got Option<str> instead."), $bt, $bu), text(styled(view("div"), ed_hover_from), "vilan \u{b7} live as you type"), $bt, $bu), $bt, $bu), $bt, $bu);
}
function tc_chip_at(left, top, color, label, $aA, $aB) {
	return $m($m($O(styled(view("div"), tc_chip), "style", "left: " + left + "; top: " + top, $aA, $aB), $O(styled(view("div"), led), "style", "background: " + color, $aA, $aB), $aA, $aB), text(view("span"), label), $aA, $aB);
}
function toolchain_art($ay, $az) {
	return $m($m($m($m($m($m($m($m($m($m($m($m($m($m($m($m($m($m(styled(view("div"), tc_wrap), styled(view("div"), tc_blob_b), $ay, $az), styled(view("div"), tc_blob_a), $ay, $az), styled(view("div"), tc_blob_c), $ay, $az), grain(), $ay, $az), styled(view("div"), tc_spoke_up), $ay, $az), styled(view("div"), tc_spoke_down), $ay, $az), styled(view("div"), tc_spoke_run), $ay, $az), styled(view("div"), tc_spoke_fmt), $ay, $az), styled(view("div"), tc_spoke_lsp), $ay, $az), styled(view("div"), tc_spoke_upgrade), $ay, $az), styled(view("div"), tc_center_mask), $ay, $az), $O($O(styled(view("div"), tc_center), "role", "img", $ay, $az), "aria-label", "vilan", $ay, $az), $ay, $az), tc_chip_at("210px", "70px", primary[0], "vilan build", $ay, $az), $ay, $az), tc_chip_at("328px", "142px", "#D84730", "vilan run --watch", $ay, $az), $ay, $az), tc_chip_at("344px", "288px", accent[0], "vilan fmt", $ay, $az), $ay, $az), tc_chip_at("210px", "360px", "#B23056", "vilan test", $ay, $az), $ay, $az), tc_chip_at("78px", "288px", "#8B2786", "vilan-lsp", $ay, $az), $ay, $az), tc_chip_at("82px", "142px", "#672283", "vilan upgrade", $ay, $az), $ay, $az);
}
function df_arrow_to(label, $bc, $bd) {
	return $m($m(styled(view("div"), df_arrow), text(styled(view("span"), df_arrow_label), label), $bc, $bd), $m($m(styled(view("div"), df_arrow_row), styled(view("div"), dg_line), $bc, $bd), styled(view("div"), arrow_head_right), $bc, $bd), $bc, $bd);
}
function df_node_view(lit, tag, body, $aZ, $ba) {
	let $bb = null;
	if (lit) {
		$bb = df_node_lit;
	} else {
		$bb = df_node;
	}
	return $m($m(styled(view("div"), $bb), text(styled(view("p"), df_tag), tag), $aZ, $ba), $m(styled(view("div"), art_code), ln(body), $aZ, $ba), $aZ, $ba);
}
function dataflow_art($aX, $aY) {
	return $m($m($m($m($m(styled(view("div"), df_wrap), styled(view("div"), df_blob_a), $aX, $aY), styled(view("div"), df_blob_b), $aX, $aY), grain(), $aX, $aY), $m($m($m($m($m(styled(view("div"), df_row), df_node_view(false, "the write", [ t("count.set("), st("2"), t(")") ], $aX, $aY), $aX, $aY), df_arrow_to("notify", $aX, $aY), $aX, $aY), df_node_view(false, "the signal", [ t("Signal<i32> "), kw("= 2") ], $aX, $aY), $aX, $aY), df_arrow_to("re-set", $aX, $aY), $aX, $aY), df_node_view(true, "the one text node", [ t("<p>clicked "), kw("2"), t(" times</p>") ], $aX, $aY), $aX, $aY), $aX, $aY), text(styled(view("p"), art_caption), "no virtual DOM, no re-render: the subscription updates exactly one node"), $aX, $aY);
}
function kw(text2) {
	return text(styled(view("span"), tk_keyword), text2);
}
function st(text2) {
	return text(styled(view("span"), tk_string), text2);
}
function t(text2) {
	return text(styled(view("span"), tk_plain), text2);
}
function fn(text2) {
	return text(styled(view("span"), tk_callable), text2);
}
function ty(text2) {
	return text(styled(view("span"), tk_type), text2);
}
function hl(text2) {
	return text(styled(view("span"), tk_hole), text2);
}
function ln(spans) {
	return children(view("div"), spans);
}
function blank() {
	return text(view("div"), " ");
}
function code_panel(lines) {
	return children(styled(view("pre"), code_pre), lines);
}
function leaf(text2) {
	return text(styled(view("code"), leaf_style), text2);
}
function leaf_link(href, text2, $bg, $bh) {
	return text($O(styled(view("a"), leaf_link_style), "href", href, $bg, $bh), text2);
}
function pt(text2) {
	return text(view("span"), text2);
}
function bloom($k, $l) {
	return $m(styled(view("div"), bloom_field), $m($m(styled(view("div"), bloom_drift), $m(styled(view("div"), bloom_blurwrap), styled(view("div"), bloom_gradient), $k, $l), $k, $l), styled(view("div"), bloom_duo), $k, $l), $k, $l);
}
function hero($T, $U) {
	return $m($m($m($m(styled(view("header"), hero_block), text(styled(view("h1"), visually_hidden), "Vilan \u{2014} The Modern Web Language"), $T, $U), $O($O(styled(view("img"), hero_mark), "src", "" + assets + "/dark_logo_flat.svg", $T, $U), "alt", "", $T, $U), $T, $U), $O($O(styled(view("img"), hero_wordmark), "src", "" + assets + "/wordmark_hero.svg", $T, $U), "alt", "VILAN", $T, $U), $T, $U), text($O(styled(view("p"), hero_tagline), "aria-hidden", "true", $T, $U), "The Modern Web Language"), $T, $U);
}
function masthead($R, $S) {
	return $m(styled(view("div"), masthead_wrap), hero($R, $S), $R, $S);
}
function divider($V, $W) {
	return $m(styled(view("div"), column), styled(view("div"), rule_line), $V, $W);
}
function grain() {
	return styled(view("div"), grain_overlay);
}
function top_bar(scroll_fade2, $p, $q) {
	return $m(style_var(styled(view("nav"), topbar), "--nav-fade", scroll_fade2, $p, $q), $m($m(styled(view("div"), add(column, nav_row)), $m($m($O(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $p, $q), $O(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $p, $q), $p, $q), text(view("span"), "VILAN"), $p, $q), $p, $q), $m($m($m($m(styled(view("div"), nav_links), text($O(styled(view("a"), nav_link), "href", "/#install", $p, $q), "Install"), $p, $q), text($O(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html", $p, $q), "Learn"), $p, $q), text($O(styled(view("a"), nav_link), "href", "/playground/", $p, $q), "Playground"), $p, $q), text($O(styled(view("a"), nav_link), "href", "/docs/", $p, $q), "Docs"), $p, $q), $p, $q), $p, $q);
}
function $a(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function $i(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[1]));
	}
	return result;
}
function $m(self, content, $n, $o) {
	place(content, self, $n, $o);
	return __clone(self);
}
function $y(self) {
	return self[0].v;
}
function $x(self, observer) {
	const id = fresh_id();
	self[1].v.push([ id, () => {
		observer($y(self));
		return;
	} ]);
	observer($y(self));
	return [ self[1], id ];
}
function $z(self, item, $A) {
	self[0].v.push(() => {
		dispose(item, $A);
		return;
	});
	return __clone(item);
}
function $t(self, observer, $u, $v) {
	$z(get_owner($v), $x(self, observer), $u);
}
function $E(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[0]));
	}
	return result;
}
function $F(self, key) {
	const $G = __map_get(self[0], hash(key));
	let $H = null;
	if ($G[0] === 0) {
		const entry = $G[1];
		$H = [ 0, __clone(entry[1]) ];
	} else {
		$H = [ 1 ];
	}
	return $H;
}
function $M(self, key) {
	self[0].delete(hash(key));
}
function $N(self, key, value) {
	self[0].set(hash(key), [ __clone(key), __clone(value) ]);
}
function $O(self, name, value, $P, $Q) {
	apply(value, self, name, $P, $Q);
	return __clone(self);
}
function $ak(self) {
	return self.length === 0;
}
function $al(self) {
	return __list_get(self, self.length - 1);
}
function $ag(self, $ah) {
	const $ai = $ah;
	let $aj = null;
	if ($ai[0] === 0) {
		const turn = $ai[1];
		$aj = enqueue(turn, self[1].v);
	} else {
		const $am = $al(draining_turns.v);
		let $an = null;
		if ($am[0] === 0) {
			const draining = $am[1];
			$an = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$an = undefined;
		}
		$aj = $an;
	}
	return $aj;
}
function $ae(self, value, $af) {
	self[0].v = value;
	$ag(self, $af);
}
function $av(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $aG(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function $aK(self) {
	return self[0].v;
}
function $aM(self, $ah) {
	const $aN = $ah;
	let $aO = null;
	if ($aN[0] === 0) {
		const turn = $aN[1];
		$aO = enqueue(turn, self[1].v);
	} else {
		const $aP = $al(draining_turns.v);
		let $aQ = null;
		if ($aP[0] === 0) {
			const draining = $aP[1];
			$aQ = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$aQ = undefined;
		}
		$aO = $aQ;
	}
	return $aO;
}
function $aL(self, value, $af) {
	self[0].v = value;
	$aM(self, $af);
}
function $aI(self, transform, $aJ) {
	$aL(self, transform($aK(self)), $aJ);
}
function $aR(self, transform, $aS) {
	const derived = $a(transform($aK(self)));
	self[1].v.push([ fresh_id(), () => {
		$ae(derived, transform($aK(self)), $aS);
		return;
	} ]);
	return derived;
}
function $bk(self, content, $n, $o) {
	place2(content, self, $n, $o);
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
const next_subscriber_id = __shared_new(0);
const draining_turns = __shared_new([  ]);
const install_label = [ [ new Map([ [ "::color", [ "::color", [ "s1i5dkrp", "color:var(--primary)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odj0cm", "letter-spacing:0.12em" ] ] ], [ "::text-transform", [ "::text-transform", [ "s1s2tj83", "text-transform:uppercase" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qqx", "margin-top:var(--space-1)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkfh", "margin-bottom:var(--space-1)" ] ] ] ]) ] ];
const install_command = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::border", [ "::border", [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ]) ] ];
const install_command_text = [ [ new Map([ [ "::display", [ "::display", [ "sowfjmu", "display:block" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ], [ "::scrollbar-width", [ "::scrollbar-width", [ "shop8ox", "scrollbar-width:none" ] ] ], [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxp9", "padding-top:var(--space-3)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiykh", "padding-bottom:var(--space-3)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vtes9o", "padding-left:16px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t5edj", "padding-right:48px" ] ] ], [ "::user-select", [ "::user-select", [ "svsrq00", "user-select:all" ] ] ] ]) ] ];
const copy_button = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::top", [ "::top", [ "s9a503", "top:6px" ] ] ], [ "::right", [ "::right", [ "svx3tuz", "right:8px" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1d7ek7w", "justify-content:center" ] ] ], [ "::width", [ "::width", [ "s178gloh", "width:28px" ] ] ], [ "::height", [ "::height", [ "s22y11v", "height:28px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jklx", "border-radius:8px" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::border", [ "::border", [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "spw2fur", "transition:border-color 80ms ease, transform 80ms ease" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s164fd6n", "border-color:var(--primary)" ] ] ], [ ":active:transform", [ ":active:transform", [ "s4vadk5", "transform:scale(0.92)" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const copy_icon = [ [ new Map([ [ "::width", [ "::width", [ "s178frfh", "width:15px" ] ] ], [ "::height", [ "::height", [ "s22x6sv", "height:15px" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const install_grid = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ] ]) ] ];
const install_split = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyv8", "gap:var(--space-8)" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s1o6spkj", "grid-template-columns:6fr 5fr" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const install_art_cell = [ [ new Map([ [ "::display", [ "::display", [ "sbiv4i3", "display:none" ] ] ], [ "1024px::display", [ "1024px::display", [ "s1pon8d1", "display:block" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const showcase_grid = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyv8", "gap:var(--space-8)" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s12tw3cj", "grid-template-columns:5fr 6fr" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const showcase_grid_flipped = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyv8", "gap:var(--space-8)" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s1o6spkj", "grid-template-columns:6fr 5fr" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const showcase_copy = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ] ]) ] ];
const demo_box = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qto", "margin-top:var(--space-4)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tki8", "margin-bottom:var(--space-4)" ] ] ], [ "::padding", [ "::padding", [ "s1ufvr2", "padding:var(--space-4)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::border", [ "::border", [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ] ]) ] ];
const demo_button = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s19dy6kf", "background-color:var(--primary)" ] ] ], [ "::color", [ "::color", [ "s30khfz", "color:var(--primary-on)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxoc", "padding-top:var(--space-2)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::font-family", [ "::font-family", [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "svhwf6a", "transition:opacity 80ms ease, transform 80ms ease" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "s1eayhf7", "opacity:0.88" ] ] ], [ ":active:transform", [ ":active:transform", [ "s4vadmw", "transform:scale(0.95)" ] ] ] ]) ] ];
const demo_label = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ]) ] ];
const diag_pre = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::padding", [ "::padding", [ "s1ufvrz", "padding:var(--space-5)" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq82np", "line-height:1.65" ] ] ], [ "::border", [ "::border", [ "szq4juv", "border:1px solid rgb(from var(--primary) r g b / 0.35)" ] ] ], [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ]) ] ];
const diag_error = [ [ new Map([ [ "::color", [ "::color", [ "s1i5dkrp", "color:var(--primary)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzhdq", "font-weight:700" ] ] ] ]) ] ];
const diag_frame = [ [ new Map([ [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const diag_stack = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ] ]) ] ];
const cards_grid = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::background", [ "::background", [ "sz4tuoy", "background:radial-gradient(340px circle at var(--glow-x, -999px) var(--glow-y, -999px), rgb(from var(--primary) r g b / 0.10), transparent 70%)" ] ] ], [ "640px::grid-template-columns", [ "640px::grid-template-columns", [ "sc664m5", "grid-template-columns:1fr 1fr" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "srts5oz", "grid-template-columns:1fr 1fr 1fr" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const card = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::padding", [ "::padding", [ "s1ufvrz", "padding:var(--space-5)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::border", [ "::border", [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ], [ "::transition", [ "::transition", [ "s1g9l6sx", "transition:background-color 160ms ease, border-color 160ms ease" ] ] ], [ ":hover:background-color", [ ":hover:background-color", [ "s3ujeas", "background-color:var(--down-bright)" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s18zucc0", "border-color:rgb(from var(--primary) r g b / 0.45)" ] ] ] ]) ] ];
const card_title = [ [ new Map([ [ "::font-family", [ "::font-family", [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayks1j", "font-size:20px" ] ] ], [ "::line-height", [ "::line-height", [ "snq94bh", "line-height:28px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1miqier", "color:var(--up-bright)" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ]) ] ];
const card_body = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ]) ] ];
const card_link = [ [ new Map([ [ "::align-self", [ "::align-self", [ "szfo4l9", "align-self:flex-start" ] ] ], [ "::display", [ "::display", [ "s2m9jw6", "display:inline-flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ], [ "::color", [ "::color", [ "s1i5dkrp", "color:var(--primary)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ ":hover:text-decoration", [ ":hover:text-decoration", [ "s10pnzzh", "text-decoration:underline" ] ] ] ]) ] ];
const link_arrow = [ [ new Map([ [ "::width", [ "::width", [ "s178fql8", "width:14px" ] ] ], [ "::height", [ "::height", [ "s22x5ym", "height:14px" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const button_link_style = [ [ new Map([ [ "::align-self", [ "::align-self", [ "szfo4l9", "align-self:flex-start" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::color", [ "::color", [ "s1i5dkrp", "color:var(--primary)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxoc", "padding-top:var(--space-2)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::border", [ "::border", [ "szq4kp4", "border:1px solid rgb(from var(--primary) r g b / 0.45)" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::transition", [ "::transition", [ "s1g9l6sx", "transition:background-color 160ms ease, border-color 160ms ease" ] ] ], [ ":hover:background-color", [ ":hover:background-color", [ "s12y9rv2", "background-color:rgb(from var(--primary) r g b / 0.12)" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s164fd6n", "border-color:var(--primary)" ] ] ] ]) ] ];
const card_icon = [ [ new Map([ [ "::width", [ "::width", [ "s178gloh", "width:28px" ] ] ], [ "::height", [ "::height", [ "s22y11v", "height:28px" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const dogfood_text = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk4ij", "font-size:15px" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const dogfood_cta = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const footer_block = [ [ new Map([ [ "::border-top", [ "::border-top", [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sxfkz7k", "padding-top:128px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1ill0x0", "padding-bottom:128px" ] ] ] ]) ] ];
const footer_grid = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyv8", "gap:var(--space-8)" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s18vdyd9", "grid-template-columns:2fr 1fr 1fr 1fr" ] ] ] ]) ] ];
const footer_head = [ [ new Map([ [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1miqier", "color:var(--up-bright)" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qru", "margin-top:var(--space-2)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ] ]) ] ];
const footer_list = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ] ]) ] ];
const footer_link = [ [ new Map([ [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::transition", [ "::transition", [ "sbcnc8a", "transition:color 80ms ease" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ], [ ":hover:text-decoration", [ ":hover:text-decoration", [ "s10pnzzh", "text-decoration:underline" ] ] ] ]) ] ];
const footer_mark = [ [ new Map([ [ "::align-self", [ "::align-self", [ "s1dnt31w", "align-self:center" ] ] ], [ "::justify-self", [ "::justify-self", [ "s1mm88t6", "justify-self:center" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const footer_micro = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::border-top", [ "::border-top", [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ], [ "::margin-top", [ "::margin-top", [ "s83cg9u", "margin-top:96px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxs0", "padding-top:var(--space-6)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyn8", "padding-bottom:var(--space-6)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::color", [ "::color", [ "shpfnhp", "color:var(--up-dim)" ] ] ] ]) ] ];
const art_stage = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::background-color", [ "::background-color", [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::--art-shadow", [ "::--art-shadow", [ "s18vcma9", "--art-shadow:var(--shadow)" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const art_card = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background-color", [ "::background-color", [ "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ] ], [ "::border", [ "::border", [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1avk2", "border-radius:14px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxq6", "padding-top:var(--space-4)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "szsnppy", "box-shadow:0 8px 40px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ] ]) ] ];
const art_tab = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk15j", "font-size:11px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1ny1qxg", "letter-spacing:0.1em" ] ] ], [ "::text-transform", [ "::text-transform", [ "s1s2tj83", "text-transform:uppercase" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qru", "margin-top:var(--space-2)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ] ]) ] ];
const art_code = [ [ new Map([ [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s24ary3", "font-size:12.5px" ] ] ], [ "::line-height", [ "::line-height", [ "s9bu6v5", "line-height:1.7" ] ] ], [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ], [ "::color", [ "::color", [ "s1hzt6rq", "color:rgb(from var(--up-bright) r g b / 0.92)" ] ] ] ]) ] ];
const art_caption = [ [ new Map([ [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odiaav", "letter-spacing:0.04em" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qto", "margin-top:var(--space-4)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tki8", "margin-bottom:var(--space-4)" ] ] ] ]) ] ];
const dot_magenta = [ [ new Map([ [ "::width", [ "::width", [ "sgdl7ao", "width:9px" ] ] ], [ "::height", [ "::height", [ "s1wxwfsy", "height:9px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::background-color", [ "::background-color", [ "s1i756l7", "background-color:#8B2786" ] ] ] ]) ] ];
const dot_orange = [ [ new Map([ [ "::width", [ "::width", [ "sgdl7ao", "width:9px" ] ] ], [ "::height", [ "::height", [ "s1wxwfsy", "height:9px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::background-color", [ "::background-color", [ "s19dy6kf", "background-color:var(--primary)" ] ] ] ]) ] ];
const arrow_head_left = [ [ new Map([ [ "::width", [ "::width", [ "sgdl6gf", "width:8px" ] ] ], [ "::height", [ "::height", [ "s1wxweyp", "height:8px" ] ] ], [ "::background-color", [ "::background-color", [ "s19dy6kf", "background-color:var(--primary)" ] ] ], [ "::clip-path", [ "::clip-path", [ "s13bfwa8", "clip-path:polygon(100% 0, 0 50%, 100% 100%)" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ] ]) ] ];
const arrow_head_right_rose = [ [ new Map([ [ "::width", [ "::width", [ "sgdl6gf", "width:8px" ] ] ], [ "::height", [ "::height", [ "s1wxweyp", "height:8px" ] ] ], [ "::background-color", [ "::background-color", [ "sumjtxl", "background-color:var(--accent)" ] ] ], [ "::clip-path", [ "::clip-path", [ "sdy8hnu", "clip-path:polygon(0 0, 100% 50%, 0 100%)" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ] ]) ] ];
const arrow_head_right = [ [ new Map([ [ "::width", [ "::width", [ "sgdl6gf", "width:8px" ] ] ], [ "::height", [ "::height", [ "s1wxweyp", "height:8px" ] ] ], [ "::background-color", [ "::background-color", [ "s19dy6kf", "background-color:var(--primary)" ] ] ], [ "::clip-path", [ "::clip-path", [ "sdy8hnu", "clip-path:polygon(0 0, 100% 50%, 0 100%)" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ] ]) ] ];
const dg_blob_top = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "semvs7h", "left:30%" ] ] ], [ "::top", [ "::top", [ "s8i24vg", "top:-14%" ] ] ], [ "::width", [ "::width", [ "sgdl1ga", "width:42%" ] ] ], [ "::height", [ "::height", [ "s1wxwavk", "height:55%" ] ] ], [ "::background-image", [ "::background-image", [ "szxtch6", "background-image:radial-gradient(closest-side, rgba(178, 48, 86, 0.5) 0%, transparent 100%)" ] ] ] ]) ] ];
const dg_blob_left = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "semvndb", "left:-8%" ] ] ], [ "::bottom", [ "::bottom", [ "s11gfv4k", "bottom:-18%" ] ] ], [ "::width", [ "::width", [ "sgdl0pp", "width:36%" ] ] ], [ "::height", [ "::height", [ "s1wxwast", "height:52%" ] ] ], [ "::background-image", [ "::background-image", [ "shcp77k", "background-image:radial-gradient(closest-side, rgba(103, 34, 131, 0.5) 0%, transparent 100%)" ] ] ] ]) ] ];
const dg_blob_right = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::right", [ "::right", [ "svx3j4l", "right:-8%" ] ] ], [ "::bottom", [ "::bottom", [ "s11gfv0w", "bottom:-14%" ] ] ], [ "::width", [ "::width", [ "sgdl0rj", "width:38%" ] ] ], [ "::height", [ "::height", [ "s1wxwast", "height:52%" ] ] ], [ "::background-image", [ "::background-image", [ "s5lsrvs", "background-image:radial-gradient(closest-side, rgba(235, 104, 46, 0.4) 0%, transparent 100%)" ] ] ] ]) ] ];
const dg_source = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background-color", [ "::background-color", [ "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ] ], [ "::border", [ "::border", [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1avk2", "border-radius:14px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxq6", "padding-top:var(--space-4)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "szsnppy", "box-shadow:0 8px 40px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ], [ "::max-width", [ "::max-width", [ "s1puqmpj", "max-width:460px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ] ]) ] ];
const dg_wire_zone = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::height", [ "::height", [ "s2310lv", "height:64px" ] ] ], [ "::display", [ "::display", [ "sbiv4i3", "display:none" ] ] ], [ "1024px::display", [ "1024px::display", [ "s1pon8d1", "display:block" ] ] ] ]) ] ];
const dg_wire_left = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::height", [ "::height", [ "s1wxw9x7", "height:2px" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::top", [ "::top", [ "s9a6ol", "top:8px" ] ] ], [ "::width", [ "::width", [ "s64rvxm", "width:210px" ] ] ], [ "::background-image", [ "::background-image", [ "sfb7qpy", "background-image:linear-gradient(270deg, #B23056 0%, #672283 100%)" ] ] ], [ "::transform", [ "::transform", [ "sxyfb32", "transform:translateX(-40px) rotate(160deg)" ] ] ] ]) ] ];
const dg_wire_right = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::height", [ "::height", [ "s1wxw9x7", "height:2px" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::top", [ "::top", [ "s9a6ol", "top:8px" ] ] ], [ "::width", [ "::width", [ "s64rvxm", "width:210px" ] ] ], [ "::background-image", [ "::background-image", [ "s10fot13", "background-image:linear-gradient(90deg, #D84730 0%, var(--primary) 100%)" ] ] ], [ "::transform", [ "::transform", [ "sllsl8", "transform:translateX(40px) rotate(20deg)" ] ] ] ]) ] ];
const dg_wire_label_left = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s23lcvu", "font-size:11.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s9d85rj", "color:var(--accent)" ] ] ], [ "::top", [ "::top", [ "s8i65b9", "top:26px" ] ] ], [ "::left", [ "::left", [ "semvrgw", "left:24%" ] ] ] ]) ] ];
const dg_wire_label_right = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s23lcvu", "font-size:11.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s9d85rj", "color:var(--accent)" ] ] ], [ "::top", [ "::top", [ "s8i65b9", "top:26px" ] ] ], [ "::right", [ "::right", [ "svx3n86", "right:24%" ] ] ] ]) ] ];
const dg_legs = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyte", "gap:var(--space-6)" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qto", "margin-top:var(--space-4)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tki8", "margin-bottom:var(--space-4)" ] ] ], [ "::align-items", [ "::align-items", [ "s13ace9s", "align-items:stretch" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s1tdau93", "grid-template-columns:1fr 230px 1fr" ] ] ] ]) ] ];
const dg_leg_head = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qru", "margin-top:var(--space-2)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ] ]) ] ];
const dg_leg_name = [ [ new Map([ [ "::font-family", [ "::font-family", [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayk4ij", "font-size:15px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ] ]) ] ];
const dg_leg_env = [ [ new Map([ [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "sayk15j", "font-size:11px" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4es", "opacity:0.5" ] ] ] ]) ] ];
const dg_mid = [ [ new Map([ [ "::display", [ "::display", [ "sbiv4i3", "display:none" ] ] ], [ "1024px::display", [ "1024px::display", [ "s10b6u2h", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1d7ek7w", "justify-content:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const dg_mid_label = [ [ new Map([ [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s23lcvu", "font-size:11.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1i5dkrp", "color:var(--primary)" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const dg_mid_label_rose = [ [ new Map([ [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s23lcvu", "font-size:11.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s9d85rj", "color:var(--accent)" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const dg_line_row = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ] ]) ] ];
const dg_line = [ [ new Map([ [ "::flex", [ "::flex", [ "skj5p4u", "flex:1" ] ] ], [ "::height", [ "::height", [ "s1wxw9x7", "height:2px" ] ] ], [ "::background-color", [ "::background-color", [ "s19dy6kf", "background-color:var(--primary)" ] ] ] ]) ] ];
const dg_line_dashed = [ [ new Map([ [ "::flex", [ "::flex", [ "skj5p4u", "flex:1" ] ] ], [ "::height", [ "::height", [ "s1wxw9x7", "height:2px" ] ] ], [ "::background", [ "::background", [ "sc7epnf", "background:repeating-linear-gradient(90deg, var(--accent) 0 5px, transparent 5px 11px)" ] ] ], [ "::animation", [ "::animation", [ "s1dyc7rh", "animation:dash-flow 1.6s linear infinite" ] ] ] ]) ] ];
const dg_note = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk15j", "font-size:11px" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4et", "opacity:0.6" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const ed_blob_a = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "semvqiz", "left:10%" ] ] ], [ "::top", [ "::top", [ "s8i25m1", "top:-20%" ] ] ], [ "::width", [ "::width", [ "sgdl34s", "width:62%" ] ] ], [ "::height", [ "::height", [ "s1wxwbn2", "height:62%" ] ] ], [ "::background-image", [ "::background-image", [ "swx3oin", "background-image:radial-gradient(closest-side, rgba(178, 48, 86, 0.55) 0%, transparent 100%)" ] ] ] ]) ] ];
const ed_blob_b = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::right", [ "::right", [ "s1mwnm2q", "right:-14%" ] ] ], [ "::bottom", [ "::bottom", [ "s11gfvrh", "bottom:-20%" ] ] ], [ "::width", [ "::width", [ "sgdl1ls", "width:48%" ] ] ], [ "::height", [ "::height", [ "s1wxwatq", "height:53%" ] ] ], [ "::background-image", [ "::background-image", [ "s1dm9aos", "background-image:radial-gradient(closest-side, rgba(235, 104, 46, 0.35) 0%, transparent 100%)" ] ] ] ]) ] ];
const ed_window = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::border", [ "::border", [ "s1m3negi", "border:1px solid rgb(from var(--up-bright) r g b / 0.14)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1atvk", "border-radius:12px" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "s1qfnv05", "box-shadow:0 24px 80px rgb(from var(--art-shadow) r g b / calc(alpha * 0.6))" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qvi", "margin-top:var(--space-6)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkk2", "margin-bottom:var(--space-6)" ] ] ] ]) ] ];
const ed_titlebar = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxp9", "padding-top:var(--space-3)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiykh", "padding-bottom:var(--space-3)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ], [ "::background-color", [ "::background-color", [ "sxiw6xl", "background-color:rgb(from var(--up-bright) r g b / 0.04)" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "spji67t", "border-bottom:1px solid rgb(from var(--up-bright) r g b / 0.08)" ] ] ] ]) ] ];
const ed_dot_red = [ [ new Map([ [ "::width", [ "::width", [ "s178fo2h", "width:11px" ] ] ], [ "::height", [ "::height", [ "s22x3fv", "height:11px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ "::background-color", [ "::background-color", [ "s1prq81g", "background-color:#D84730" ] ] ] ]) ] ];
const ed_dot_orange = [ [ new Map([ [ "::width", [ "::width", [ "s178fo2h", "width:11px" ] ] ], [ "::height", [ "::height", [ "s22x3fv", "height:11px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ "::background-color", [ "::background-color", [ "s19dy6kf", "background-color:var(--primary)" ] ] ] ]) ] ];
const ed_dot_magenta = [ [ new Map([ [ "::width", [ "::width", [ "s178fo2h", "width:11px" ] ] ], [ "::height", [ "::height", [ "s22x3fv", "height:11px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ "::background-color", [ "::background-color", [ "s1i756l7", "background-color:#8B2786" ] ] ] ]) ] ];
const ed_title = [ [ new Map([ [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ] ]) ] ];
const ed_body = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxq6", "padding-top:var(--space-4)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq90yh", "line-height:24px" ] ] ] ]) ] ];
const ed_gutter = [ [ new Map([ [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ], [ "::width", [ "::width", [ "s178i1rz", "width:44px" ] ] ], [ "::text-align", [ "::text-align", [ "s1czd0mf", "text-align:right" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t31ia", "padding-right:16px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1ih", "opacity:0.28" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const ed_code = [ [ new Map([ [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ], [ "::color", [ "::color", [ "s1hzt6rq", "color:rgb(from var(--up-bright) r g b / 0.92)" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ] ]) ] ];
const ed_squiggle = [ [ new Map([ [ "::text-decoration", [ "::text-decoration", [ "s16zcev2", "text-decoration:underline wavy var(--art-error) 1.5px" ] ] ], [ "::text-underline-offset", [ "::text-underline-offset", [ "s1jf3sec", "text-underline-offset:5px" ] ] ] ]) ] ];
const ed_caret = [ [ new Map([ [ "::display", [ "::display", [ "sfatq7m", "display:inline-block" ] ] ], [ "::width", [ "::width", [ "sgdl1ex", "width:2px" ] ] ], [ "::height", [ "::height", [ "s22x6sv", "height:15px" ] ] ], [ "::background-color", [ "::background-color", [ "syz58y5", "background-color:var(--up-bright)" ] ] ], [ "::vertical-align", [ "::vertical-align", [ "s18wji4a", "vertical-align:text-bottom" ] ] ], [ "::margin-left", [ "::margin-left", [ "szjsw2c", "margin-left:1px" ] ] ], [ "::animation", [ "::animation", [ "s1fjlvgr", "animation:caret-blink 1.1s step-start infinite" ] ] ] ]) ] ];
const ed_hover = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::left", [ "::left", [ "s1ypvw5g", "left:clamp(120px, 30%, 185px)" ] ] ], [ "::top", [ "::top", [ "s1vku06o", "top:300px" ] ] ], [ "::width", [ "::width", [ "s1o8o1ug", "width:min(400px, 70%)" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::border", [ "::border", [ "s1m3nek6", "border:1px solid rgb(from var(--up-bright) r g b / 0.18)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1as72", "border-radius:10px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxp9", "padding-top:var(--space-3)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiykh", "padding-bottom:var(--space-3)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "s3qy95a", "box-shadow:0 16px 48px rgb(from var(--art-shadow) r g b / calc(alpha * 0.55))" ] ] ], [ "::z-index", [ "::z-index", [ "sehvv7j", "z-index:2" ] ] ] ]) ] ];
const ed_hover_error = [ [ new Map([ [ "::font-size", [ "::font-size", [ "s24ary3", "font-size:12.5px" ] ] ], [ "::line-height", [ "::line-height", [ "s9bu6v4", "line-height:1.6" ] ] ], [ "::color", [ "::color", [ "s1r7vnvj", "color:var(--art-error)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ] ]) ] ];
const ed_hover_from = [ [ new Map([ [ "::margin-top", [ "::margin-top", [ "snx6qru", "margin-top:var(--space-2)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk15j", "font-size:11px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1k8", "opacity:0.45" ] ] ] ]) ] ];
const ed_statusbar = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxoc", "padding-top:var(--space-2)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk15j", "font-size:11px" ] ] ], [ "::border-top", [ "::border-top", [ "sxf8ud1", "border-top:1px solid rgb(from var(--up-bright) r g b / 0.08)" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ] ]) ] ];
const ed_problem = [ [ new Map([ [ "::color", [ "::color", [ "s1r7vnvj", "color:var(--art-error)" ] ] ] ]) ] ];
const ed_status_right = [ [ new Map([ [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ] ]) ] ];
const tc_wrap = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::width", [ "::width", [ "s667hsd", "width:420px" ] ] ], [ "::height", [ "::height", [ "s1wqggao", "height:430px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::background-color", [ "::background-color", [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::--art-shadow", [ "::--art-shadow", [ "s18vcma9", "--art-shadow:var(--shadow)" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const tc_blob_a = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "semvqqb", "left:18%" ] ] ], [ "::top", [ "::top", [ "s99zzy", "top:22%" ] ] ], [ "::width", [ "::width", [ "sgdl36m", "width:64%" ] ] ], [ "::height", [ "::height", [ "s1wxwayb", "height:58%" ] ] ], [ "::background-image", [ "::background-image", [ "smbhl57", "background-image:radial-gradient(closest-side, rgba(178, 48, 86, 0.6) 0%, transparent 100%)" ] ] ] ]) ] ];
const tc_blob_b = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "s1xbl9by", "left:4%" ] ] ], [ "::top", [ "::top", [ "s1fnzz8s", "top:2%" ] ] ], [ "::width", [ "::width", [ "sgdl1i4", "width:44%" ] ] ], [ "::height", [ "::height", [ "s1wxw9yk", "height:42%" ] ] ], [ "::background-image", [ "::background-image", [ "s1rryo6p", "background-image:radial-gradient(closest-side, rgba(139, 39, 134, 0.5) 0%, transparent 100%)" ] ] ] ]) ] ];
const tc_blob_c = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::right", [ "::right", [ "svx3j0x", "right:-4%" ] ] ], [ "::bottom", [ "::bottom", [ "sv9p3z1", "bottom:-2%" ] ] ], [ "::width", [ "::width", [ "sgdl1jy", "width:46%" ] ] ], [ "::height", [ "::height", [ "s1wxwa28", "height:46%" ] ] ], [ "::background-image", [ "::background-image", [ "sqc5kkd", "background-image:radial-gradient(closest-side, rgba(235, 104, 46, 0.45) 0%, transparent 100%)" ] ] ] ]) ] ];
const tc_spoke_up = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background-color", [ "::background-color", [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s8i9ux0", "top:70px" ] ] ], [ "::width", [ "::width", [ "sgdl0ko", "width:1px" ] ] ], [ "::height", [ "::height", [ "s1wod31f", "height:145px" ] ] ] ]) ] ];
const tc_spoke_down = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background-color", [ "::background-color", [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s1vk5h1x", "top:215px" ] ] ], [ "::width", [ "::width", [ "sgdl0ko", "width:1px" ] ] ], [ "::height", [ "::height", [ "s1wod31f", "height:145px" ] ] ] ]) ] ];
const tc_spoke_run = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background-color", [ "::background-color", [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s1vk5h1x", "top:215px" ] ] ], [ "::width", [ "::width", [ "s645n5d", "width:154px" ] ] ], [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::transform", [ "::transform", [ "s1cmm6dq", "transform:rotate(-28.2deg)" ] ] ] ]) ] ];
const tc_spoke_fmt = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background-color", [ "::background-color", [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s1vk5h1x", "top:215px" ] ] ], [ "::width", [ "::width", [ "s645mb4", "width:153px" ] ] ], [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::transform", [ "::transform", [ "s1rnupr9", "transform:rotate(28.6deg)" ] ] ] ]) ] ];
const tc_spoke_lsp = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background-color", [ "::background-color", [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s1vk5h1x", "top:215px" ] ] ], [ "::width", [ "::width", [ "s645jsd", "width:150px" ] ] ], [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::transform", [ "::transform", [ "ss7z4r2", "transform:rotate(151deg)" ] ] ] ]) ] ];
const tc_spoke_upgrade = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background-color", [ "::background-color", [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s1vk5h1x", "top:215px" ] ] ], [ "::width", [ "::width", [ "s644xxv", "width:147px" ] ] ], [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::transform", [ "::transform", [ "s1tbwy2j", "transform:rotate(-150.3deg)" ] ] ] ]) ] ];
const tc_chip = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::transform", [ "::transform", [ "skw0huo", "transform:translate(-50%, -50%)" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::background-color", [ "::background-color", [ "s1leb7x8", "background-color:rgb(from var(--down-normal) r g b / 0.92)" ] ] ], [ "::border", [ "::border", [ "s1m3neic", "border:1px solid rgb(from var(--up-bright) r g b / 0.16)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1t4wgdk", "border-radius:999px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxoc", "padding-top:var(--space-2)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s24ary3", "font-size:12.5px" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "s1oql1iy", "box-shadow:0 6px 28px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ], [ "::white-space", [ "::white-space", [ "s1ctk0je", "white-space:nowrap" ] ] ] ]) ] ];
const led = [ [ new Map([ [ "::width", [ "::width", [ "sgdl5m6", "width:7px" ] ] ], [ "::height", [ "::height", [ "s1wxwe4g", "height:7px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ] ]) ] ];
const tc_center_mask = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::top", [ "::top", [ "s9a2gv", "top:50%" ] ] ], [ "::transform", [ "::transform", [ "skw0huo", "transform:translate(-50%, -50%)" ] ] ], [ "::width", [ "::width", [ "s64uyum", "width:250px" ] ] ], [ "::height", [ "::height", [ "s1wocyu6", "height:140px" ] ] ], [ "::background-image", [ "::background-image", [ "s101azu3", "background-image:radial-gradient(closest-side, rgb(from var(--down-dim) r g b / 0.84) 35%, transparent 100%)" ] ] ] ]) ] ];
const tc_center = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::top", [ "::top", [ "s9a2gv", "top:50%" ] ] ], [ "::transform", [ "::transform", [ "skw0huo", "transform:translate(-50%, -50%)" ] ] ], [ "::width", [ "::width", [ "s644s24", "width:140px" ] ] ], [ "::aspect-ratio", [ "::aspect-ratio", [ "s1wfw2s5", "aspect-ratio:311 / 64" ] ] ], [ "::background-color", [ "::background-color", [ "syz58y5", "background-color:var(--up-bright)" ] ] ], [ "::-webkit-mask", [ "::-webkit-mask", [ "smlee52", "-webkit-mask:url(https://vilan-lang.org/assets/wordmark_hero_light.svg) center / contain no-repeat" ] ] ], [ "::mask", [ "::mask", [ "satia6u", "mask:url(https://vilan-lang.org/assets/wordmark_hero_light.svg) center / contain no-repeat" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const df_wrap = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxtu", "padding-top:var(--space-8)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyp2", "padding-bottom:var(--space-8)" ] ] ], [ "::display", [ "::display", [ "sbiv4i3", "display:none" ] ] ], [ "1024px::display", [ "1024px::display", [ "s1pon8d1", "display:block" ] ] ], [ "::background-color", [ "::background-color", [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::--art-shadow", [ "::--art-shadow", [ "s18vcma9", "--art-shadow:var(--shadow)" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const df_blob_a = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "s1xbl9a4", "left:2%" ] ] ], [ "::top", [ "::top", [ "s8i26ga", "top:-30%" ] ] ], [ "::width", [ "::width", [ "sgdl0k7", "width:30%" ] ] ], [ "::height", [ "::height", [ "s22x2l5", "height:120%" ] ] ], [ "::background-image", [ "::background-image", [ "s1ffmfd1", "background-image:radial-gradient(closest-side, rgba(139, 39, 134, 0.45) 0%, transparent 100%)" ] ] ] ]) ] ];
const df_blob_b = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::right", [ "::right", [ "smhpc5c", "right:0%" ] ] ], [ "::top", [ "::top", [ "s8i25m1", "top:-20%" ] ] ], [ "::width", [ "::width", [ "sgdl0nv", "width:34%" ] ] ], [ "::height", [ "::height", [ "s22x2l5", "height:120%" ] ] ], [ "::background-image", [ "::background-image", [ "s1534wu5", "background-image:radial-gradient(closest-side, rgba(216, 71, 48, 0.5) 0%, transparent 100%)" ] ] ] ]) ] ];
const df_row = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ] ]) ] ];
const df_node = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background-color", [ "::background-color", [ "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ] ], [ "::border", [ "::border", [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1atvk", "border-radius:12px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxq6", "padding-top:var(--space-4)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "szsnppy", "box-shadow:0 8px 40px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ] ]) ] ];
const df_node_lit = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background-color", [ "::background-color", [ "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ] ], [ "::border", [ "::border", [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1atvk", "border-radius:12px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxq6", "padding-top:var(--space-4)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "s1atclq1", "box-shadow:0 0 34px rgb(from var(--primary) r g b / 0.25), 0 8px 32px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ], [ "::border-color", [ "::border-color", [ "sgud36h", "border-color:rgb(from var(--primary) r g b / 0.6)" ] ] ] ]) ] ];
const df_tag = [ [ new Map([ [ "::font-size", [ "::font-size", [ "s22vxtl", "font-size:10.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1ny1qxg", "letter-spacing:0.1em" ] ] ], [ "::text-transform", [ "::text-transform", [ "s1s2tj83", "text-transform:uppercase" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4es", "opacity:0.5" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qqx", "margin-top:var(--space-1)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkfh", "margin-bottom:var(--space-1)" ] ] ] ]) ] ];
const df_arrow = [ [ new Map([ [ "::flex", [ "::flex", [ "skj5p4u", "flex:1" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ] ]) ] ];
const df_arrow_label = [ [ new Map([ [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s23lcvu", "font-size:11.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1i5dkrp", "color:var(--primary)" ] ] ] ]) ] ];
const df_arrow_row = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::width", [ "::width", [ "s178flj9", "width:100%" ] ] ] ]) ] ];
const code_pre = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::padding", [ "::padding", [ "s1ufvrz", "padding:var(--space-5)" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq82np", "line-height:1.65" ] ] ], [ "::border", [ "::border", [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ], [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ]) ] ];
const tk_keyword = [ [ new Map([ [ "::color", [ "::color", [ "s1i5dkrp", "color:var(--primary)" ] ] ] ]) ] ];
const tk_string = [ [ new Map([ [ "::color", [ "::color", [ "s9d85rj", "color:var(--accent)" ] ] ] ]) ] ];
const tk_plain = [ [ new Map([ [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ]) ] ];
const tk_callable = [ [ new Map([ [ "::color", [ "::color", [ "s1anp4hp", "color:var(--tint-callable)" ] ] ] ]) ] ];
const tk_type = [ [ new Map([ [ "::color", [ "::color", [ "s1miqier", "color:var(--up-bright)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ] ]) ] ];
const tk_hole = [ [ new Map([ [ "::color", [ "::color", [ "s1i5dkrp", "color:var(--primary)" ] ] ] ]) ] ];
const leaf_style = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::border", [ "::border", [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5qxi", "padding-top:1px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzsqi", "padding-bottom:1px" ] ] ], [ "::padding-left", [ "::padding-left", [ "srvufzf", "padding-left:6px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1rpv33l", "padding-right:6px" ] ] ], [ "::white-space", [ "::white-space", [ "s1ctk0je", "white-space:nowrap" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ]) ] ];
const leaf_link_style = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::background-color", [ "::background-color", [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ], [ "::border", [ "::border", [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jh8x", "border-radius:4px" ] ] ], [ "::padding-top", [ "::padding-top", [ "sku5qxi", "padding-top:1px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s14jzsqi", "padding-bottom:1px" ] ] ], [ "::padding-left", [ "::padding-left", [ "srvufzf", "padding-left:6px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1rpv33l", "padding-right:6px" ] ] ], [ "::white-space", [ "::white-space", [ "s1ctk0je", "white-space:nowrap" ] ] ], [ "::font-family", [ "::font-family", [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ], [ "::color", [ "::color", [ "s1miqier", "color:var(--up-bright)" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "s1hj754t", "text-decoration:underline dotted rgb(from var(--primary) r g b / 0.7) 1px" ] ] ], [ "::text-underline-offset", [ "::text-underline-offset", [ "s1jf3qpu", "text-underline-offset:3px" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s164fd6n", "border-color:var(--primary)" ] ] ] ]) ] ];
const bloom_field = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::top", [ "::top", [ "s80ttlx", "top:0" ] ] ], [ "::left", [ "::left", [ "s8k3705", "left:0" ] ] ], [ "::width", [ "::width", [ "s178flj9", "width:100%" ] ] ], [ "::height", [ "::height", [ "sbp2tui", "height:calc(64px + clamp(1100px, 100vw, 1920px) * 0.570864)" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::--bloom-plum", [ "::--bloom-plum", [ "s1uiy6wn", "--bloom-plum:#95304D" ] ] ], [ "::--bloom-violet", [ "::--bloom-violet", [ "s6maw3t", "--bloom-violet:#8B2786" ] ] ], [ "::--bloom-scarlet", [ "::--bloom-scarlet", [ "s176vjaw", "--bloom-scarlet:#D84730" ] ] ] ]) ] ];
const bloom_drift = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::inset", [ "::inset", [ "s1ucbaf9", "inset:0" ] ] ], [ "::animation", [ "::animation", [ "s1u16gt0", "animation:bloom-drift-a 44s ease-in-out infinite alternate" ] ] ] ]) ] ];
const bloom_blurwrap = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::inset", [ "::inset", [ "s1ucbaf9", "inset:0" ] ] ], [ "::filter", [ "::filter", [ "sdxlu80", "filter:blur(calc(clamp(1100px, 100vw, 1920px) * 0.052)) saturate(1.25) brightness(1.12) url(#bloom-texture)" ] ] ] ]) ] ];
const bloom_gradient = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::transform", [ "::transform", [ "s183tt1x", "transform:translateX(-50%)" ] ] ], [ "::top", [ "::top", [ "s1ppzw09", "top:calc(64px - clamp(1100px, 100vw, 1920px) * 0.049226)" ] ] ], [ "::width", [ "::width", [ "s183om2p", "width:clamp(1100px, 100vw, 1920px)" ] ] ], [ "::height", [ "::height", [ "sst8zpc", "height:calc(clamp(1100px, 100vw, 1920px) * 0.62009)" ] ] ], [ "::-webkit-mask-size", [ "::-webkit-mask-size", [ "sdml5s3", "-webkit-mask-size:100% 100%" ] ] ], [ "::mask-size", [ "::mask-size", [ "s14catfn", "mask-size:100% 100%" ] ] ], [ "::-webkit-mask-image", [ "::-webkit-mask-image", [ "ss9iuu0", "-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E  %3C/svg%3E \")" ] ] ], [ "::mask-image", [ "::mask-image", [ "sk413s", "mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E  %3C/svg%3E \")" ] ] ], [ "::background-image", [ "::background-image", [ "siub6a0", "background-image:radial-gradient(30% 10% ellipse at 61% 24%, rgb(226 184 231), rgb(247 229 249 / 70%) 74%, transparent 80%), radial-gradient(42% 40% ellipse at 62% 40%, rgb(255 106 0 / 95%), rgb(217 118 48 / 65%) 50%, transparent 78%), radial-gradient(61% 67% ellipse at 23% 48%, rgb(175 38 168 / 95%), rgb(237 64 7 / 60%) 45%, transparent 76%), radial-gradient(40% 46% ellipse at 92% 48%, rgba(216, 71, 48, 0.95), rgba(216, 71, 48, 0.7) 45%, transparent 78%), radial-gradient(26% 40% ellipse at 2% 50%, rgba(216, 71, 48, 0.9), transparent 74%), radial-gradient(36% 26% ellipse at 45% 78%, rgba(178, 48, 86, 0.7), transparent 76%), radial-gradient(22% 20% ellipse at 20% 84%, rgba(103, 34, 131, 0.8), transparent 74%), linear-gradient(100deg, var(--bloom-plum) 0%, var(--bloom-violet) 25%, var(--primary) 55%, var(--bloom-scarlet) 85%, var(--bloom-scarlet) 100%)" ] ] ], [ "::background-size", [ "::background-size", [ "s1as7syx", "background-size:calc(clamp(1100px, 100vw, 1920px) * 0.78125) calc(clamp(1100px, 100vw, 1920px) * 0.78125)" ] ] ] ]) ] ];
const bloom_duo = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::transform", [ "::transform", [ "s183tt1x", "transform:translateX(-50%)" ] ] ], [ "::top", [ "::top", [ "s1ppzw09", "top:calc(64px - clamp(1100px, 100vw, 1920px) * 0.049226)" ] ] ], [ "::width", [ "::width", [ "s183om2p", "width:clamp(1100px, 100vw, 1920px)" ] ] ], [ "::height", [ "::height", [ "sst8zpc", "height:calc(clamp(1100px, 100vw, 1920px) * 0.62009)" ] ] ], [ "::-webkit-mask-size", [ "::-webkit-mask-size", [ "sdml5s3", "-webkit-mask-size:100% 100%" ] ] ], [ "::mask-size", [ "::mask-size", [ "s14catfn", "mask-size:100% 100%" ] ] ], [ "::-webkit-mask-image", [ "::-webkit-mask-image", [ "sthis8v", "-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg filter=\'url(%23filter0_f_51_26)\'%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E %3Cdefs%3E %3Cfilter id=\'filter0_f_51_26\' x=\'0\' y=\'-92.4345\' width=\'1877.72\' height=\'1164.39\' filterUnits=\'userSpaceOnUse\' color-interpolation-filters=\'sRGB\'%3E %3CfeFlood flood-opacity=\'0\' result=\'BackgroundImageFix\'/%3E %3CfeBlend mode=\'normal\' in=\'SourceGraphic\' in2=\'BackgroundImageFix\' result=\'shape\'/%3E %3CfeGaussianBlur stdDeviation=\'100\' result=\'effect1_foregroundBlur_51_26\'/%3E %3C/filter%3E %3C/defs%3E %3C/svg%3E \")" ] ] ], [ "::mask-image", [ "::mask-image", [ "sfm8fb3", "mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg filter=\'url(%23filter0_f_51_26)\'%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E %3Cdefs%3E %3Cfilter id=\'filter0_f_51_26\' x=\'0\' y=\'-92.4345\' width=\'1877.72\' height=\'1164.39\' filterUnits=\'userSpaceOnUse\' color-interpolation-filters=\'sRGB\'%3E %3CfeFlood flood-opacity=\'0\' result=\'BackgroundImageFix\'/%3E %3CfeBlend mode=\'normal\' in=\'SourceGraphic\' in2=\'BackgroundImageFix\' result=\'shape\'/%3E %3CfeGaussianBlur stdDeviation=\'100\' result=\'effect1_foregroundBlur_51_26\'/%3E %3C/filter%3E %3C/defs%3E %3C/svg%3E \")" ] ] ], [ "::background-image", [ "::background-image", [ "s13ldclz", "background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E %3Cfilter id=\'d\' x=\'0\' y=\'0\' width=\'100%25\' height=\'100%25\' color-interpolation-filters=\'sRGB\'%3E %3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'2\' numOctaves=\'3\' seed=\'3214\' stitchTiles=\'stitch\' result=\'n\'/%3E %3CfeColorMatrix in=\'n\' type=\'matrix\' values=\'1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1\' result=\'n1\'/%3E %3CfeColorMatrix in=\'n1\' type=\'luminanceToAlpha\' result=\'a\'/%3E %3CfeComponentTransfer in=\'a\' result=\'m1\'%3E%3CfeFuncA type=\'discrete\' tableValues=\'1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\'/%3E%3C/feComponentTransfer%3E %3CfeFlood flood-color=\'%23262324\' result=\'f1\'/%3E %3CfeComposite in=\'f1\' in2=\'m1\' operator=\'in\' result=\'dark\'/%3E %3CfeComponentTransfer in=\'a\' result=\'m2\'%3E%3CfeFuncA type=\'discrete\' tableValues=\'0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\'/%3E%3C/feComponentTransfer%3E %3CfeFlood flood-color=\'rgba(255, 89, 0, 0.57)\' result=\'f2\'/%3E %3CfeComposite in=\'f2\' in2=\'m2\' operator=\'in\' result=\'orange\'/%3E %3CfeMerge%3E%3CfeMergeNode in=\'dark\'/%3E%3CfeMergeNode in=\'orange\'/%3E%3C/feMerge%3E %3C/filter%3E %3Crect width=\'120\' height=\'120\' filter=\'url(%2523d)\'/%3E %3C/svg%3E\")" ] ] ], [ "::background-size", [ "::background-size", [ "skugn91", "background-size:120px 120px" ] ] ], [ "::mix-blend-mode", [ "::mix-blend-mode", [ "s1ddx1v8", "mix-blend-mode:soft-light" ] ] ] ]) ] ];
const masthead_wrap = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ] ]) ] ];
const hero_block = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::height", [ "::height", [ "ss654zr", "height:calc(clamp(1100px, 100vw, 1920px) * 0.52917)" ] ] ], [ "::padding-top", [ "::padding-top", [ "srk904b", "padding-top:calc(clamp(1100px, 100vw, 1920px) * 0.15208)" ] ] ], [ "::gap", [ "::gap", [ "s1pnyybd", "gap:calc(clamp(1100px, 100vw, 1920px) * 0.03333)" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ] ]) ] ];
const hero_mark = [ [ new Map([ [ "::width", [ "::width", [ "s1t71824", "width:calc(clamp(1100px, 100vw, 1920px) * 0.05208)" ] ] ], [ "::height", [ "::height", [ "s23znoa", "height:auto" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const hero_wordmark = [ [ new Map([ [ "::width", [ "::width", [ "s1tv0w0m", "width:calc(clamp(1100px, 100vw, 1920px) * 0.16198)" ] ] ], [ "::height", [ "::height", [ "s23znoa", "height:auto" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const hero_tagline = [ [ new Map([ [ "::font-family", [ "::font-family", [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "s169txcv", "font-size:max(18px, clamp(1100px, 100vw, 1920px) * 0.01667)" ] ] ], [ "::line-height", [ "::line-height", [ "s9bu6v3", "line-height:1.5" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s15t7ncn", "color:#120004" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const primary = [ "var(--primary)", ":root{--primary:#EB682E}@media (prefers-color-scheme: light){:root{--primary:#AE3611}}" ];
const accent = [ "var(--accent)", ":root{--accent:#E5AFD9}@media (prefers-color-scheme: light){:root{--accent:#922A7C}}" ];
const assets = "https://vilan-lang.org/assets";
const repo = "https://github.com/vilan-lang/vilan";
const shell = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ], [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::min-height", [ "::min-height", [ "sondrfd", "min-height:100%" ] ] ], [ "::font-family", [ "::font-family", [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayk3oa", "font-size:14px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8cl8", "line-height:18px" ] ] ] ]) ] ];
const column = [ [ new Map([ [ "::max-width", [ "::max-width", [ "s1eamei2", "max-width:1264px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vtg8d6", "padding-left:32px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t4hls", "padding-right:32px" ] ] ] ]) ] ];
const no_drag = [ [ new Map([ [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const section_block = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "s18lh5xs", "padding-top:var(--space-24)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1v942yc", "padding-bottom:var(--space-24)" ] ] ] ]) ] ];
const stack = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ] ]) ] ];
const reveal = [ [ new Map([ [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const heading = [ [ new Map([ [ "::font-family", [ "::font-family", [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayllga", "font-size:32px" ] ] ], [ "::line-height", [ "::line-height", [ "snqanrz", "line-height:48px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1miqier", "color:var(--up-bright)" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const lead = [ [ new Map([ [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::max-width", [ "::max-width", [ "s1pu2qte", "max-width:36rem" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const rule_line = [ [ new Map([ [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::background-color", [ "::background-color", [ "s1hcpyu4", "background-color:var(--stroke-soft)" ] ] ] ]) ] ];
const grain_overlay = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::inset", [ "::inset", [ "s1ucbaf9", "inset:0" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ], [ "::mix-blend-mode", [ "::mix-blend-mode", [ "sc8sqhh", "mix-blend-mode:overlay" ] ] ], [ "::background-image", [ "::background-image", [ "s192ko3e", "background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'240\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'240\' height=\'240\' filter=\'url(%23n)\' opacity=\'0.55\'/%3E%3C/svg%3E\")" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const visually_hidden = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::width", [ "::width", [ "sgdl0ko", "width:1px" ] ] ], [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::clip-path", [ "::clip-path", [ "sx3450x", "clip-path:inset(50%)" ] ] ] ]) ] ];
const topbar = [ [ new Map([ [ "::position", [ "::position", [ "s1onro1c", "position:sticky" ] ] ], [ "::top", [ "::top", [ "s80ttlx", "top:0" ] ] ], [ "::z-index", [ "::z-index", [ "si5ywm6", "z-index:100" ] ] ], [ "::background-color", [ "::background-color", [ "s1dq5yi8", "background-color:rgb(from var(--down-dim) r g b / calc(var(--nav-fade, 0) * 0.86))" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "sc9brgc", "border-bottom:1px solid rgb(from var(--stroke-hard) r g b / calc(var(--nav-fade, 0) * 0.9))" ] ] ], [ "::backdrop-filter", [ "::backdrop-filter", [ "shx44pg", "backdrop-filter:blur(calc(var(--nav-fade, 0) * 14px))" ] ] ] ]) ] ];
const nav_row = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ], [ "::height", [ "::height", [ "s2310lv", "height:64px" ] ] ] ]) ] ];
const nav_brand = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odkmbv", "letter-spacing:0.35em" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ] ]) ] ];
const nav_mark = [ [ new Map([ [ "::display", [ "::display", [ "sowfjmu", "display:block" ] ] ], [ "::width", [ "::width", [ "s178hbq8", "width:36px" ] ] ], [ "::height", [ "::height", [ "s22x9bm", "height:18px" ] ] ], [ "::background-color", [ "::background-color", [ "syz58y5", "background-color:var(--up-bright)" ] ] ], [ "::-webkit-mask", [ "::-webkit-mask", [ "scqkrg6", "-webkit-mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ], [ "::mask", [ "::mask", [ "s11mtiwm", "mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ] ]) ] ];
const nav_links = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::gap", [ "::gap", [ "s8myyte", "gap:var(--space-6)" ] ] ] ]) ] ];
const nav_link = [ [ new Map([ [ "::color", [ "::color", [ "ssxqrx8", "color:var(--up-normal)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::transition", [ "::transition", [ "sbcnc8a", "transition:color 80ms ease" ] ] ], [ ":hover:color", [ ":hover:color", [ "s1ytnaev", "color:var(--up-bright)" ] ] ] ]) ] ];
const scroll_fade = $a("0");
mount_root("app", ($b) => {
	return page(scroll_fade, (text2) => {
		return navigator.clipboard.writeText(text2);
	}, [ 1 ], $b, [ 1 ]);
});
const passive = JSON.parse("{\"passive\": true}");
const probe = document.querySelector("html");
const reduced_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const targets = document.querySelectorAll("." + class_list(reveal));
const viewport = probe.clientHeight;
let $bL = null;
if (!(reduced_motion)) {
	for (const target of targets) {
		if (target.getBoundingClientRect().top > viewport - 40.0) {
			target.style.setProperty("opacity", "0");
			target.style.setProperty("transform", "translateY(28px)");
		}
	}
	$bL = undefined;
}
$bL;
const publish = () => {
	return $av([ 1 ], ($bM) => {
		const progress = Math.max(Math.min(probe.scrollTop / 64.0, 1.0), 0.0);
		$ae(scroll_fade, "" + progress, [ 0, $bM ]);
		let $bN = null;
		if (!(reduced_motion)) {
			const line = probe.clientHeight * 0.92;
			for (const target2 of targets) {
				if (target2.getBoundingClientRect().top < line) {
					target2.style.setProperty("transition", "opacity 600ms ease, transform 600ms ease");
					target2.style.setProperty("opacity", "1");
					target2.style.setProperty("transform", "none");
				}
			}
			$bN = undefined;
		}
		return $bN;
	});
};
publish();
window.addEventListener("scroll", publish, passive);
const grid = document.querySelector("[data-glow]");
grid.addEventListener("mousemove", (mouse) => {
	const bounds = grid.getBoundingClientRect();
	grid.style.setProperty("--glow-x", "" + (mouse.clientX - bounds.left) + "px");
	grid.style.setProperty("--glow-y", "" + (mouse.clientY - bounds.top) + "px");
	return;
}, JSON.parse("{\"passive\": true}"));
