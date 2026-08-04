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
		while (!($ah(turn[0].v)) && budget > 0) {
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
		return $as([ 1 ], ($ar) => {
			return handler($ar);
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
function bind_text(self, source, $aR, $aS) {
	const element = __clone(self[0]);
	$aT(source, (value) => {
		element.textContent = value;
		return;
	}, $aR, $aS);
	return __clone(self);
}
function bind_attr(self, name, source, $at, $au) {
	const element = __clone(self[0]);
	$av(source, (value) => {
		element.setAttribute(name, value);
		return;
	}, $at, $au);
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
function mount(id, view2) {
	const element = document.getElementById(id);
	element.replaceChildren();
	element.appendChild(view2[0]);
}
function mount_root(id, body) {
	const $bJ = $bI([ 1 ], ($bG) => {
		return $bH(body);
	});
	const built = $bJ[0];
	const root = $bJ[1];
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
			$J = $K(rules, key, entry);
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
function install_row(label, command, copy, $X, $Y, $Z) {
	const icon = $a("" + assets + "/icons/copy.svg");
	const pending = __shared_new([ 1 ]);
	return $m($m(view("div"), text(styled(view("p"), install_label), label), $X, $Y), $m($m(styled(view("div"), install_command), text(styled(view("span"), install_command_text), command), $X, $Y), $m(on($L(styled(view("button"), copy_button), "aria-label", "Copy command", $X, $Y), "click", ($aa) => {
		copy(command);
		$ab(icon, "" + assets + "/icons/check.svg", [ 0, $aa ]);
		const $al = pending.v;
		let $am = null;
		if ($al[0] === 0) {
			const timer = $al[1];
			$am = cancel(timer);
		} else {
			$am = undefined;
		}
		$am;
		const timer2 = after(2400);
		pending.v = [ 0, __clone(timer2) ];
		__task(async () => {
			if (await (wait(timer2, $Z))) {
				$ab(icon, "" + assets + "/icons/copy.svg", [ 0, $aa ]);
			}
			return;
		}, "install_row");
		return;
	}), bind_attr($L(styled(view("img"), copy_icon), "alt", "", $X, $Y), "src", icon, $X, $Y), $X, $Y), $X, $Y), $X, $Y);
}
function install_section(copy, $U, $V, $W) {
	return $m($m($m(styled($L(view("section"), "id", "install", $U, $V), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "One command, the whole toolchain"), $U, $V), $m($m($m(styled(view("p"), lead), pt("The compiler, dev server with hot reload, formatter, test runner, and language server live in one small binary. There is nothing else to install and nothing to configure. Update any time with "), $U, $V), leaf("vilan upgrade"), $U, $V), pt("."), $U, $V), $U, $V), $m($m(styled(view("div"), install_split), $m($m($m(styled(view("div"), install_grid), install_row("macOS / Linux", "curl -fsSL https://github.com/vilan-lang/vilan/releases/latest/download/install.sh | sh", copy, $U, $V, $W), $U, $V), install_row("Windows (PowerShell)", "irm https://github.com/vilan-lang/vilan/releases/latest/download/install.ps1 | iex", copy, $U, $V, $W), $U, $V), install_row("Homebrew", "brew install vilan-lang/vilan/vilan", copy, $U, $V, $W), $U, $V), $U, $V), $m(styled(view("div"), install_art_cell), toolchain_art($U, $V), $U, $V), $U, $V), $U, $V);
}
function showcase(prose, code, $aU, $aV) {
	return $m($m(styled(view("div"), showcase_grid), prose, $aU, $aV), code, $aU, $aV);
}
function showcase_flipped(code, prose, $bo, $bp) {
	return $m($m(styled(view("div"), showcase_grid_flipped), code, $bo, $bp), prose, $bo, $bp);
}
function counter_demo($aC, $aD) {
	const count = $aE(0);
	return $m($m(styled(view("div"), demo_box), on(text(styled(view("button"), demo_button), "+1"), "click", ($aF) => {
		return $aG(count, (n) => {
			return n + 1;
		}, [ 0, $aF ]);
	}), $aC, $aD), bind_text(styled(view("p"), demo_label), $aP(count, (n) => {
		return "clicked " + n + " times";
	}, $aC), $aC, $aD), $aC, $aD);
}
function showcase_reactive($aA, $aB) {
	return $m($m(styled(view("section"), add(add(column, section_block), stack)), showcase($m($m($m($m(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "UI that follows your data"), $aA, $aB), $m($m($m(styled(view("p"), lead), pt("A view is a value and a binding is a subscription: "), $aA, $aB), leaf("bind_text"), $aA, $aB), pt(" sets the text node once, then sets it again whenever the signal changes. There is no virtual DOM, no render loop, and no dependency array to babysit. Updates land exactly where the data changed."), $aA, $aB), $aA, $aB), text(styled(view("p"), lead), "The snippet is the whole program, and it runs. Try it right here:"), $aA, $aB), counter_demo($aA, $aB), $aA, $aB), code_panel([ ln([ kw("import"), t(" std::ui::{ view, mount_root };") ]), ln([ kw("import"), t(" std::reactive::"), ty("Signal"), t(";") ]), blank(), ln([ kw("fun"), t(" "), fn("main"), t("() {") ]), ln([ t("    "), kw("let"), t(" count = "), ty("Signal"), t("::"), fn("new"), t("("), st("0"), t(");") ]), ln([ t("    "), kw("let"), t(" _root = "), fn("mount_root"), t("("), st("\"app\""), t(", || {") ]), ln([ t("        "), fn("view"), t("("), st("\"div\""), t(")") ]), ln([ t("            ."), fn("child"), t("("), fn("view"), t("("), st("\"p\""), t(")."), fn("bind_text"), t("(count."), fn("map"), t("(|n: i32| "), st("i\"clicked "), hl("{"), t("n"), hl("}"), st(" times\""), t(")))") ]), ln([ t("            ."), fn("child"), t("("), fn("view"), t("("), st("\"button\""), t(")."), fn("text"), t("("), st("\"+1\""), t(")."), fn("on"), t("("), st("\"click\""), t(", || count."), fn("set_with"), t("(|n| n + "), st("1"), t(")))") ]), ln([ t("    });") ]), ln([ t("}") ]) ]), $aA, $aB), $aA, $aB), dataflow_art($aA, $aB), $aA, $aB);
}
function showcase_fullstack($bd, $be) {
	return $m($m($m($m(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "The server is a struct. The client is generated."), $bd, $be), $m($m($m($m($m(styled(view("p"), lead), pt("Mark a method "), $bd, $be), leaf_link("/docs/guide/services.html#what-rpc-calls-do", "[rpc]", $bd, $be), $bd, $be), pt(" and the browser can call it like any other function, typed and checked. Mark a signal "), $bd, $be), leaf_link("/docs/guide/services.html#mirrors", "[expose]", $bd, $be), $bd, $be), pt(" and every connected client holds a live mirror that updates when the server writes. You never write REST endpoints, fetch calls, or the JSON shapes that drift out of sync between them."), $bd, $be), $bd, $be), diagram($bd, $be), $bd, $be), button_link("/docs/guide/services.html", "Services & RPC in the guide", $bd, $be), $bd, $be);
}
function showcase_compiler($bm, $bn) {
	return $m(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped($m($m(styled(view("div"), diag_stack), code_panel([ ln([ kw("import"), t(" std::print;") ]), ln([ kw("import"), t(" std::option::"), ty("Option"), t("::{ self, "), ty("Some"), t(", "), ty("None"), t(" };") ]), ln([ kw("fun"), t(" "), fn("find_user"), t("(id: i32): "), ty("Option"), t("<str> {") ]), ln([ t("    "), kw("if"), t(" id == "), st("1"), t(" { "), ty("Some"), t("("), st("\"Ada\""), t(") } "), kw("else"), t(" { "), ty("None"), t(" }") ]), ln([ t("}") ]), ln([ kw("fun"), t(" "), fn("greet"), t("(name: str): str {") ]), ln([ t("    "), st("i\"hello "), hl("{"), t("name"), hl("}"), st("\"") ]), ln([ t("}") ]), ln([ kw("fun"), t(" "), fn("main"), t("() {") ]), ln([ t("    "), fn("print"), t("("), fn("greet"), t("("), fn("find_user"), t("("), st("2"), t(")));") ]), ln([ t("}") ]) ]), $bm, $bn), $m($m($m($m($m($m($m(styled(view("pre"), diag_pre), ln([ text(styled(view("span"), diag_error), "Error:"), t(" Expected str, but got Option<str> instead.") ]), $bm, $bn), ln([ text(styled(view("span"), diag_frame), "    \u{256d}\u{2500}[ demo.vl:10:14 ]") ]), $bm, $bn), ln([ text(styled(view("span"), diag_frame), "    \u{2502}") ]), $bm, $bn), ln([ text(styled(view("span"), diag_frame), " 10 \u{2502}     print(greet(find_user(2)));") ]), $bm, $bn), ln([ text(styled(view("span"), diag_frame), "    \u{2502}                 \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{252c}\u{2500}\u{2500}\u{2500}\u{2500}") ]), $bm, $bn), ln([ text(styled(view("span"), diag_frame), "    \u{2502}                       \u{2570}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500} Expected str, but got Option<str> instead.") ]), $bm, $bn), ln([ text(styled(view("span"), diag_frame), "\u{2500}\u{2500}\u{2500}\u{2500}\u{256f}") ]), $bm, $bn), $bm, $bn), $m($m($m($m(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "Find out at compile time"), $bm, $bn), $m($m($m($m($m(styled(view("p"), lead), pt("Vilan has no null and no exceptions. A value that might be missing is an "), $bm, $bn), leaf_link("/docs/std/option-result.html#optiont", "Option", $bm, $bn), $bm, $bn), pt(", a call that might fail returns a "), $bm, $bn), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $bm, $bn), $bm, $bn), pt(", and the compiler makes you look inside before you use either. The mistake in this snippet is a build error, not a production incident."), $bm, $bn), $bm, $bn), text(styled(view("p"), lead), "Values are copied rather than silently shared, so two names never fight over one object. Most of the mistakes JavaScript saves for runtime cannot even be written."), $bm, $bn), button_link("/docs/std/option-result.html", "Option & Result in the reference", $bm, $bn), $bm, $bn), $bm, $bn), $bm, $bn);
}
function editor_band($bq, $br) {
	return $m(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped(editor_art($bq, $br), $m($m($m($m(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "The editor is in on it"), $bq, $br), $m($m($m($m(styled(view("p"), lead), leaf("vilan"), $bq, $br), pt(" and "), $bq, $br), leaf("vilan-lsp"), $bq, $br), pt(" ship together so your editor and build never disagree. In-editor diagnostics, hover types and docs, autocompletion, Symbol Rename, formatting, and Organize Imports are all available in VS Code today."), $bq, $br), $bq, $br), text(styled(view("p"), lead), "One broken line does not take the tooling down. The rest of the file keeps compiling, serving hovers, and completing while you fix it."), $bq, $br), button_link("https://github.com/vilan-lang/vilan/tree/main/editors/vscode", "The VS Code extension", $bq, $br), $bq, $br), $bq, $br), $bq, $br);
}
function button_link(href, label, $bk, $bl) {
	return $m($m($L(styled(view("a"), button_link_style), "href", href, $bk, $bl), pt(label), $bk, $bl), $L($L(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $bk, $bl), "alt", "", $bk, $bl), $bk, $bl);
}
function docs_link(href, label, $by, $bz) {
	return $m($m($L(styled(view("a"), card_link), "href", href, $by, $bz), pt(label), $by, $bz), $L($L(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $by, $bz), "alt", "", $by, $bz), $by, $bz);
}
function feature(icon, name, href, body, $bw, $bx) {
	return $m($m($m($m(styled(view("article"), card), $L($L(styled(view("img"), card_icon), "src", "" + assets + "/icons/" + icon + ".svg", $bw, $bx), "alt", "", $bw, $bx), $bw, $bx), text(styled(view("h3"), card_title), name), $bw, $bx), children(styled(view("p"), card_body), body), $bw, $bx), docs_link(href, "docs", $bw, $bx), $bw, $bx);
}
function feature_grid($bu, $bv) {
	return $m($m(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "Built into the language"), $bu, $bv), $m($m($m($m($m($m($L(styled(view("div"), cards_grid), "data-glow", "", $bu, $bv), feature("shield-check", "No null, no exceptions", "/docs/std/option-result.html", [ pt("A missing value is an "), leaf_link("/docs/std/option-result.html#optiont", "Option", $bu, $bv), pt(", a failure is a "), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $bu, $bv), pt(", and "), leaf("match"), pt(" makes you handle both arms. Errors are ordinary values you pass around like any other data.") ], $bu, $bv), $bu, $bv), feature("copy", "Values, not references", "/docs/tour/memory-model.html", [ pt("Assignment copies. Sharing is explicit, borrowing is checked, and spooky action at a distance is a compile error.") ], $bu, $bv), $bu, $bv), feature("zap", "Async without the ceremony", "/docs/tour/async.html", [ leaf_link("/docs/tour/async.html#opting-out-of-waiting-async-and-await", "await", $bu, $bv), pt(" is implicit. Call an async function and the machinery is the compiler\'s problem. When you want real concurrency, tasks and "), leaf_link("/docs/tour/async.html#nurseries-structured-spawning", "nurseries", $bu, $bv), pt(" give it structure.") ], $bu, $bv), $bu, $bv), feature("layers", "One program, two platforms", "/docs/tour/platforms.html", [ pt("One workspace compiles the node server and the browser client. The compiler tracks which code needs which platform and keeps each bundle honest.") ], $bu, $bv), $bu, $bv), feature("server", "Rendered before it ships", "/docs/guide/ssr.html", [ leaf("std::ui"), pt(" renders on the server too: first paint is real markup, then the client rebuilds it live. View source on this page and the content is already there.") ], $bu, $bv), $bu, $bv), feature("refresh-cw", "A dev loop that keeps up", "/docs/guide/dev-loop.html", [ leaf("vilan run . --watch"), pt(" rebuilds in milliseconds and hot-reloads the browser. Format, test, and language server ship in the same binary.") ], $bu, $bv), $bu, $bv), $bu, $bv);
}
function dogfood($bA, $bB) {
	return $m($m($m(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("p"), dogfood_text), "This site is a vilan program: one package, two entries. The server rendered the markup you first saw, and the browser rebuilt it live."), $bA, $bB), text(styled(view("p"), dogfood_text), "Vilan is built to last. Semantics are settled on paper before they are implemented, and pinned by tests after. A language is a foundation, and a foundation should not move under you."), $bA, $bB), $m(styled(view("p"), dogfood_cta), docs_link("https://github.com/vilan-lang/website", "Read this page\'s source", $bA, $bB), $bA, $bB), $bA, $bB);
}
function footer_column(title, links, $bE, $bF) {
	return $m($m(view("div"), text(styled(view("p"), footer_head), title), $bE, $bF), children(styled(view("div"), footer_list), links), $bE, $bF);
}
function page_footer($bC, $bD) {
	return $m($m(styled(view("footer"), footer_block), $m($m($m($m(styled(view("div"), add(column, footer_grid)), styled($L($L($L(view("img"), "src", "" + assets + "/footer_mark.webp", $bC, $bD), "alt", "The vilan mark", $bC, $bD), "width", "200", $bC, $bD), footer_mark), $bC, $bD), footer_column("Using Vilan", [ text($L(styled(view("a"), footer_link), "href", "#install", $bC, $bD), "Install"), text($L(styled(view("a"), footer_link), "href", "/docs/tour/hello-vilan.html", $bC, $bD), "Learn"), text($L(styled(view("a"), footer_link), "href", "/docs/", $bC, $bD), "Documentation") ], $bC, $bD), $bC, $bD), footer_column("Community", [ text($L(styled(view("a"), footer_link), "href", "" + repo + "/issues", $bC, $bD), "Issues"), text($L(styled(view("a"), footer_link), "href", "" + repo + "/discussions", $bC, $bD), "Discussions"), text($L(styled(view("a"), footer_link), "href", "https://github.com/vilan-lang", $bC, $bD), "GitHub") ], $bC, $bD), $bC, $bD), footer_column("Terms & policies", [ text($L(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/CODE_OF_CONDUCT.md", $bC, $bD), "Code of Conduct"), text($L(styled(view("a"), footer_link), "href", "" + repo + "#license", $bC, $bD), "Licenses"), text($L(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/assets/branding/LICENSE", $bC, $bD), "Logo Policy") ], $bC, $bD), $bC, $bD), $bC, $bD), $m(styled(view("div"), column), $m($m(styled(view("div"), footer_micro), text(view("span"), "\u{a9} 2026 Reed Syllas"), $bC, $bD), text(view("span"), "MIT or Apache-2.0"), $bC, $bD), $bC, $bD), $bC, $bD);
}
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $an) {
	return await (self[0].wait(ambient_signal($an)));
}
function cancel(self) {
	self[0].cancel();
}
function ambient_signal($ao) {
	const $ap = $ao;
	let $aq = null;
	if ($ap[0] === 0) {
		const n = $ap[1];
		$aq = [ 0, n.signal_of() ];
	} else {
		$aq = [ 1 ];
	}
	return $aq;
}
function diagram($bh, $bi) {
	return $m($m($m($m($m($m($m($m(styled(view("div"), art_stage), styled(view("div"), dg_blob_top), $bh, $bi), styled(view("div"), dg_blob_left), $bh, $bi), styled(view("div"), dg_blob_right), $bh, $bi), grain(), $bh, $bi), $m($m(styled(view("div"), dg_source), $bj(styled(view("p"), art_tab), "notes.vl \u{b7} one source", $bh, $bi), $bh, $bi), $m($m($m($m($m($m($m($m($m(styled(view("div"), art_code), ln([ t("["), kw("service"), t("(NotesClient)]") ]), $bh, $bi), ln([ kw("struct"), t(" Notes {") ]), $bh, $bi), ln([ t("    ["), kw("expose"), t("] entries: Signal<List<Note>>,") ]), $bh, $bi), ln([ t("}") ]), $bh, $bi), blank(), $bh, $bi), ln([ kw("impl"), t(" Notes {") ]), $bh, $bi), ln([ t("    ["), kw("rpc"), t("]") ]), $bh, $bi), ln([ t("    "), kw("fun"), t(" add(self, text: str): i32 { \u{2026} }") ]), $bh, $bi), ln([ t("}") ]), $bh, $bi), $bh, $bi), $bh, $bi), $m($m($m($m(styled(view("div"), dg_wire_zone), styled(view("div"), dg_wire_left), $bh, $bi), styled(view("div"), dg_wire_right), $bh, $bi), $bj(styled(view("span"), dg_wire_label_left), "vilan build", $bh, $bi), $bh, $bi), $bj(styled(view("span"), dg_wire_label_right), "vilan build", $bh, $bi), $bh, $bi), $bh, $bi), $m($m($m(styled(view("div"), dg_legs), $m($m(styled(view("div"), art_card), $m($m($m(styled(view("div"), dg_leg_head), styled(view("div"), dot_magenta), $bh, $bi), $bj(styled(view("span"), dg_leg_name), "the server", $bh, $bi), $bh, $bi), $bj(styled(view("span"), dg_leg_env), "node", $bh, $bi), $bh, $bi), $bh, $bi), $m($m(styled(view("div"), art_code), ln([ t("serve_service(4000,") ]), $bh, $bi), ln([ t("    notes.dispatcher() \u{2026})") ]), $bh, $bi), $bh, $bi), $bh, $bi), $m($m(styled(view("div"), dg_mid), $m($m(view("div"), $bj(styled(view("p"), dg_mid_label), "notes.add(\"ship it\")", $bh, $bi), $bh, $bi), $m($m(styled(view("div"), dg_line_row), styled(view("div"), arrow_head_left), $bh, $bi), styled(view("div"), dg_line), $bh, $bi), $bh, $bi), $bh, $bi), $m($m($m(view("div"), $m($m(styled(view("div"), dg_line_row), styled(view("div"), dg_line_dashed), $bh, $bi), styled(view("div"), arrow_head_right_rose), $bh, $bi), $bh, $bi), $bj(styled(view("p"), dg_mid_label_rose), "entries", $bh, $bi), $bh, $bi), $bj(styled(view("p"), dg_note), "mirrored live", $bh, $bi), $bh, $bi), $bh, $bi), $bh, $bi), $m($m(styled(view("div"), art_card), $m($m($m(styled(view("div"), dg_leg_head), styled(view("div"), dot_orange), $bh, $bi), $bj(styled(view("span"), dg_leg_name), "the client", $bh, $bi), $bh, $bi), $bj(styled(view("span"), dg_leg_env), "browser", $bh, $bi), $bh, $bi), $bh, $bi), $m($m(styled(view("div"), art_code), ln([ kw("let"), t(" notes = NotesClient::connect("), st("\"/rpc\""), t(");") ]), $bh, $bi), ln([ t("notes.entries "), t("// Signal, live") ]), $bh, $bi), $bh, $bi), $bh, $bi), $bh, $bi), $bj(styled(view("p"), art_caption), "one definition: the compiler builds both sides and keeps them honest", $bh, $bi), $bh, $bi);
}
function editor_art($bs, $bt) {
	return $m($m($m($m(styled(view("div"), art_stage), styled(view("div"), ed_blob_a), $bs, $bt), styled(view("div"), ed_blob_b), $bs, $bt), grain(), $bs, $bt), $m($m($m($m(styled(view("div"), ed_window), $m($m($m($m(styled(view("div"), ed_titlebar), styled(view("div"), ed_dot_red), $bs, $bt), styled(view("div"), ed_dot_orange), $bs, $bt), styled(view("div"), ed_dot_magenta), $bs, $bt), text(styled(view("span"), ed_title), "app.vl \u{2014} vilan"), $bs, $bt), $bs, $bt), $m($m(styled(view("div"), ed_body), text(styled(view("div"), ed_gutter), "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"), $bs, $bt), $m($m($m($m($m($m($m($m($m($m($m(styled(view("div"), ed_code), ln([ kw("import"), t(" std::print;") ]), $bs, $bt), ln([ kw("import"), t(" std::option::Option::{ self, Some, None };") ]), $bs, $bt), ln([ kw("fun"), t(" find_user(id: i32): Option<str> {") ]), $bs, $bt), ln([ t("    "), kw("if"), t(" id == 1 { Some("), st("\"Ada\""), t(") } "), kw("else"), t(" { None }") ]), $bs, $bt), ln([ t("}") ]), $bs, $bt), ln([ kw("fun"), t(" greet(name: str): str {") ]), $bs, $bt), ln([ t("    "), st("i\"hello {name}\"") ]), $bs, $bt), ln([ t("}") ]), $bs, $bt), ln([ kw("fun"), t(" main() {") ]), $bs, $bt), ln([ t("    print(greet("), text(styled(view("span"), ed_squiggle), "find_user(2)"), t("));"), styled(view("span"), ed_caret) ]), $bs, $bt), ln([ t("}") ]), $bs, $bt), $bs, $bt), $bs, $bt), $m($m($m(styled(view("div"), ed_statusbar), text(styled(view("span"), ed_problem), "\u{2297} 1"), $bs, $bt), text(view("span"), "vilan-lsp"), $bs, $bt), text(styled(view("span"), ed_status_right), "Ln 10, Col 17 \u{b7} app.vl"), $bs, $bt), $bs, $bt), $m($m(styled(view("div"), ed_hover), text(styled(view("div"), ed_hover_error), "Expected str, but got Option<str> instead."), $bs, $bt), text(styled(view("div"), ed_hover_from), "vilan \u{b7} live as you type"), $bs, $bt), $bs, $bt), $bs, $bt);
}
function tc_chip_at(left, top, color, label, $ay, $az) {
	return $m($m($L(styled(view("div"), tc_chip), "style", "left: " + left + "; top: " + top, $ay, $az), $L(styled(view("div"), led), "style", "background: " + color, $ay, $az), $ay, $az), text(view("span"), label), $ay, $az);
}
function toolchain_art($aw, $ax) {
	return $m($m($m($m($m($m($m($m($m($m($m($m($m($m($m($m($m($m(styled(view("div"), tc_wrap), styled(view("div"), tc_blob_b), $aw, $ax), styled(view("div"), tc_blob_a), $aw, $ax), styled(view("div"), tc_blob_c), $aw, $ax), grain(), $aw, $ax), styled(view("div"), tc_spoke_up), $aw, $ax), styled(view("div"), tc_spoke_down), $aw, $ax), styled(view("div"), tc_spoke_run), $aw, $ax), styled(view("div"), tc_spoke_fmt), $aw, $ax), styled(view("div"), tc_spoke_lsp), $aw, $ax), styled(view("div"), tc_spoke_upgrade), $aw, $ax), styled(view("div"), tc_center_mask), $aw, $ax), $L($L(styled(view("img"), tc_center), "src", "" + assets + "/wordmark_hero_light.svg", $aw, $ax), "alt", "vilan", $aw, $ax), $aw, $ax), tc_chip_at("210px", "70px", "#EB682E", "vilan build", $aw, $ax), $aw, $ax), tc_chip_at("346px", "142px", "#D84730", "vilan run --watch", $aw, $ax), $aw, $ax), tc_chip_at("344px", "288px", "#E5AFD9", "vilan fmt", $aw, $ax), $aw, $ax), tc_chip_at("210px", "360px", "#B23056", "vilan test", $aw, $ax), $aw, $ax), tc_chip_at("78px", "288px", "#8B2786", "vilan-lsp", $aw, $ax), $aw, $ax), tc_chip_at("82px", "142px", "#672283", "vilan upgrade", $aw, $ax), $aw, $ax);
}
function df_arrow_to(label, $bb, $bc) {
	return $m($m(styled(view("div"), df_arrow), text(styled(view("span"), df_arrow_label), label), $bb, $bc), $m($m(styled(view("div"), df_arrow_row), styled(view("div"), dg_line), $bb, $bc), styled(view("div"), arrow_head_right), $bb, $bc), $bb, $bc);
}
function df_node_view(lit, tag, body, $aY, $aZ) {
	let $ba = null;
	if (lit) {
		$ba = df_node_lit;
	} else {
		$ba = df_node;
	}
	return $m($m(styled(view("div"), $ba), text(styled(view("p"), df_tag), tag), $aY, $aZ), $m(styled(view("div"), art_code), ln(body), $aY, $aZ), $aY, $aZ);
}
function dataflow_art($aW, $aX) {
	return $m($m($m($m($m(styled(view("div"), df_wrap), styled(view("div"), df_blob_a), $aW, $aX), styled(view("div"), df_blob_b), $aW, $aX), grain(), $aW, $aX), $m($m($m($m($m(styled(view("div"), df_row), df_node_view(false, "the write", [ t("count.set("), st("2"), t(")") ], $aW, $aX), $aW, $aX), df_arrow_to("notify", $aW, $aX), $aW, $aX), df_node_view(false, "the signal", [ t("Signal<i32> "), kw("= 2") ], $aW, $aX), $aW, $aX), df_arrow_to("re-set", $aW, $aX), $aW, $aX), df_node_view(true, "the one text node", [ t("<p>clicked "), kw("2"), t(" times</p>") ], $aW, $aX), $aW, $aX), $aW, $aX), text(styled(view("p"), art_caption), "no virtual DOM, no re-render: the subscription updates exactly one node"), $aW, $aX);
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
function leaf_link(href, text2, $bf, $bg) {
	return text($L(styled(view("a"), leaf_link_style), "href", href, $bf, $bg), text2);
}
function pt(text2) {
	return text(view("span"), text2);
}
function top_bar(scroll_fade2, $p, $q) {
	return $m(style_var(styled(view("nav"), topbar), "--nav-fade", scroll_fade2, $p, $q), $m($m(styled(view("div"), add(column, nav_row)), $m($m($L(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $p, $q), $L($L($L(styled(view("img"), no_drag), "src", "" + assets + "/mark.svg", $p, $q), "alt", "", $p, $q), "height", "18", $p, $q), $p, $q), text(view("span"), "VILAN"), $p, $q), $p, $q), $m($m($m(styled(view("div"), nav_links), text($L(styled(view("a"), nav_link), "href", "#install", $p, $q), "Install"), $p, $q), text($L(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html", $p, $q), "Learn"), $p, $q), text($L(styled(view("a"), nav_link), "href", "/docs/", $p, $q), "Docs"), $p, $q), $p, $q), $p, $q);
}
function bloom($k, $l) {
	return $m(styled(view("div"), bloom_field), $m($m(styled(view("div"), bloom_drift), $m(styled(view("div"), bloom_blurwrap), styled(view("div"), bloom_gradient), $k, $l), $k, $l), styled(view("div"), bloom_duo), $k, $l), $k, $l);
}
function hero($Q, $R) {
	return $m($m($m($m(styled(view("header"), hero_block), text(styled(view("h1"), visually_hidden), "Vilan \u{2014} The Modern Web Language"), $Q, $R), $L($L(styled(view("img"), hero_mark), "src", "" + assets + "/dark_logo_flat.svg", $Q, $R), "alt", "", $Q, $R), $Q, $R), $L($L(styled(view("img"), hero_wordmark), "src", "" + assets + "/wordmark_hero.svg", $Q, $R), "alt", "VILAN", $Q, $R), $Q, $R), text($L(styled(view("p"), hero_tagline), "aria-hidden", "true", $Q, $R), "The Modern Web Language"), $Q, $R);
}
function masthead($O, $P) {
	return $m(styled(view("div"), masthead_wrap), hero($O, $P), $O, $P);
}
function divider($S, $T) {
	return $m(styled(view("div"), column), styled(view("div"), rule_line), $S, $T);
}
function grain() {
	return styled(view("div"), grain_overlay);
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
function $K(self, key, value) {
	self[0].set(hash(key), [ __clone(key), __clone(value) ]);
}
function $L(self, name, value, $M, $N) {
	apply(value, self, name, $M, $N);
	return __clone(self);
}
function $ah(self) {
	return self.length === 0;
}
function $ai(self) {
	return __list_get(self, self.length - 1);
}
function $ad(self, $ae) {
	const $af = $ae;
	let $ag = null;
	if ($af[0] === 0) {
		const turn = $af[1];
		$ag = enqueue(turn, self[1].v);
	} else {
		const $aj = $ai(draining_turns.v);
		let $ak = null;
		if ($aj[0] === 0) {
			const draining = $aj[1];
			$ak = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$ak = undefined;
		}
		$ag = $ak;
	}
	return $ag;
}
function $ab(self, value, $ac) {
	self[0].v = value;
	$ad(self, $ac);
}
function $as(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
function $av(self, observer, $u, $v) {
	$z(get_owner($v), $x(self, observer), $u);
}
function $aE(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function $aI(self) {
	return self[0].v;
}
function $aK(self, $ae) {
	const $aL = $ae;
	let $aM = null;
	if ($aL[0] === 0) {
		const turn = $aL[1];
		$aM = enqueue(turn, self[1].v);
	} else {
		const $aN = $ai(draining_turns.v);
		let $aO = null;
		if ($aN[0] === 0) {
			const draining = $aN[1];
			$aO = enqueue(draining, self[1].v);
		} else {
			for (const subscriber of self[1].v) {
				subscriber[1]();
			}
			$aO = undefined;
		}
		$aM = $aO;
	}
	return $aM;
}
function $aJ(self, value, $ac) {
	self[0].v = value;
	$aK(self, $ac);
}
function $aG(self, transform, $aH) {
	$aJ(self, transform($aI(self)), $aH);
}
function $aP(self, transform, $aQ) {
	const derived = $a(transform($aI(self)));
	self[1].v.push([ fresh_id(), () => {
		$ab(derived, transform($aI(self)), $aQ);
		return;
	} ]);
	return derived;
}
function $aT(self, observer, $u, $v) {
	$z(get_owner($v), $x(self, observer), $u);
}
function $bj(self, content, $n, $o) {
	place2(content, self, $n, $o);
	return __clone(self);
}
function $bH(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, __clone(scope) ];
}
function $bI(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[2].v = true;
	return result;
}
const next_subscriber_id = __shared_new(0);
const draining_turns = __shared_new([  ]);
const install_label = [ [ new Map([ [ "::color", [ "::color", [ "s1j2narg", "color:#EB682E" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odj0cm", "letter-spacing:0.12em" ] ] ], [ "::text-transform", [ "::text-transform", [ "s1s2tj83", "text-transform:uppercase" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qqx", "margin-top:var(--space-1)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkfh", "margin-bottom:var(--space-1)" ] ] ] ]) ] ];
const install_command = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9ro", "border-radius:var(--space-2)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ] ]) ] ];
const install_command_text = [ [ new Map([ [ "::display", [ "::display", [ "sowfjmu", "display:block" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ], [ "::scrollbar-width", [ "::scrollbar-width", [ "shop8ox", "scrollbar-width:none" ] ] ], [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxp9", "padding-top:var(--space-3)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiykh", "padding-bottom:var(--space-3)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vtes9o", "padding-left:16px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t5edj", "padding-right:48px" ] ] ], [ "::user-select", [ "::user-select", [ "svsrq00", "user-select:all" ] ] ] ]) ] ];
const copy_button = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::top", [ "::top", [ "s9a503", "top:6px" ] ] ], [ "::right", [ "::right", [ "svx3tuz", "right:8px" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1d7ek7w", "justify-content:center" ] ] ], [ "::width", [ "::width", [ "s178h6oq", "width:30px" ] ] ], [ "::height", [ "::height", [ "s22ym24", "height:30px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jklx", "border-radius:8px" ] ] ], [ "::background", [ "::background", [ "s1tk27e6", "background:rgba(27, 6, 13, 0.85)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "s6o39gb", "transition:border-color 140ms ease, transform 120ms ease" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "szh62f9", "border-color:rgba(235, 104, 46, 0.6)" ] ] ], [ ":active:transform", [ ":active:transform", [ "s4vadk5", "transform:scale(0.92)" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const copy_icon = [ [ new Map([ [ "::width", [ "::width", [ "s178frfh", "width:15px" ] ] ], [ "::height", [ "::height", [ "s22x6sv", "height:15px" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const install_grid = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ] ]) ] ];
const install_split = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyv8", "gap:var(--space-8)" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s1o6spkj", "grid-template-columns:6fr 5fr" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const install_art_cell = [ [ new Map([ [ "::display", [ "::display", [ "sbiv4i3", "display:none" ] ] ], [ "1024px::display", [ "1024px::display", [ "s1pon8d1", "display:block" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const showcase_grid = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyv8", "gap:var(--space-8)" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s12tw3cj", "grid-template-columns:5fr 6fr" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const showcase_grid_flipped = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyv8", "gap:var(--space-8)" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s1o6spkj", "grid-template-columns:6fr 5fr" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const showcase_copy = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ] ]) ] ];
const demo_box = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qto", "margin-top:var(--space-4)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tki8", "margin-bottom:var(--space-4)" ] ] ], [ "::padding", [ "::padding", [ "s1ufvr2", "padding:var(--space-4)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9sl", "border-radius:var(--space-3)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ] ]) ] ];
const demo_button = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1r3dxyn", "background-color:#F9DFE7" ] ] ], [ "::color", [ "::color", [ "s15t7ncn", "color:#120004" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxoc", "padding-top:var(--space-2)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1t4wgdk", "border-radius:999px" ] ] ], [ "::border", [ "::border", [ "s1mnphwb", "border:none" ] ] ], [ "::font-size", [ "::font-size", [ "sayk3oa", "font-size:14px" ] ] ], [ "::font-family", [ "::font-family", [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::cursor", [ "::cursor", [ "s1onu0uk", "cursor:pointer" ] ] ], [ "::transition", [ "::transition", [ "s1q90ag8", "transition:transform 120ms ease, opacity 120ms ease" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "s1eayhf7", "opacity:0.88" ] ] ], [ ":active:transform", [ ":active:transform", [ "s4vadmw", "transform:scale(0.95)" ] ] ] ]) ] ];
const demo_label = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ] ]) ] ];
const diag_pre = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9sl", "border-radius:var(--space-3)" ] ] ], [ "::padding", [ "::padding", [ "s1ufvrz", "padding:var(--space-5)" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq82np", "line-height:1.65" ] ] ], [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::border", [ "::border", [ "s7hf5tb", "border:1px solid rgba(235, 104, 46, 0.35)" ] ] ], [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ] ]) ] ];
const diag_error = [ [ new Map([ [ "::color", [ "::color", [ "s1j2narg", "color:#EB682E" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzhdq", "font-weight:700" ] ] ] ]) ] ];
const diag_frame = [ [ new Map([ [ "::opacity", [ "::opacity", [ "s3a4es", "opacity:0.5" ] ] ] ]) ] ];
const diag_stack = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ], [ "::min-width", [ "::min-width", [ "sitgfdt", "min-width:0" ] ] ] ]) ] ];
const cards_grid = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::background", [ "::background", [ "s1uptu5m", "background:radial-gradient(340px circle at var(--glow-x, -999px) var(--glow-y, -999px), rgba(235, 104, 46, 0.10), transparent 70%)" ] ] ], [ "640px::grid-template-columns", [ "640px::grid-template-columns", [ "sc664m5", "grid-template-columns:1fr 1fr" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "srts5oz", "grid-template-columns:1fr 1fr 1fr" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const card = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::padding", [ "::padding", [ "s1ufvrz", "padding:var(--space-5)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9sl", "border-radius:var(--space-3)" ] ] ], [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::transition", [ "::transition", [ "sfzbmas", "transition:transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease" ] ] ], [ ":hover:transform", [ ":hover:transform", [ "s5y13ij", "transform:translateY(-3px)" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "s1k7kmrq", "border-color:rgba(249, 223, 231, 0.22)" ] ] ], [ ":hover:box-shadow", [ ":hover:box-shadow", [ "s167j7tw", "box-shadow:0 10px 32px rgba(0, 0, 0, 0.4)" ] ] ] ]) ] ];
const card_title = [ [ new Map([ [ "::font-family", [ "::font-family", [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayks1j", "font-size:20px" ] ] ], [ "::line-height", [ "::line-height", [ "snq94bh", "line-height:28px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ]) ] ];
const card_body = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1n2", "opacity:0.78" ] ] ] ]) ] ];
const card_link = [ [ new Map([ [ "::align-self", [ "::align-self", [ "szfo4l9", "align-self:flex-start" ] ] ], [ "::display", [ "::display", [ "s2m9jw6", "display:inline-flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ], [ "::color", [ "::color", [ "s1j2narg", "color:#EB682E" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ ":hover:text-decoration", [ ":hover:text-decoration", [ "s10pnzzh", "text-decoration:underline" ] ] ] ]) ] ];
const link_arrow = [ [ new Map([ [ "::width", [ "::width", [ "s178fql8", "width:14px" ] ] ], [ "::height", [ "::height", [ "s22x5ym", "height:14px" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const button_link_style = [ [ new Map([ [ "::align-self", [ "::align-self", [ "szfo4l9", "align-self:flex-start" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::color", [ "::color", [ "s1j2narg", "color:#EB682E" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxoc", "padding-top:var(--space-2)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1t4wgdk", "border-radius:999px" ] ] ], [ "::border", [ "::border", [ "s7hf6nk", "border:1px solid rgba(235, 104, 46, 0.45)" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::transition", [ "::transition", [ "s1g9l6sx", "transition:background-color 160ms ease, border-color 160ms ease" ] ] ], [ ":hover:background", [ ":hover:background", [ "s4tt0v2", "background:rgba(235, 104, 46, 0.12)" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "szh62h3", "border-color:rgba(235, 104, 46, 0.8)" ] ] ] ]) ] ];
const card_icon = [ [ new Map([ [ "::width", [ "::width", [ "s178gloh", "width:28px" ] ] ], [ "::height", [ "::height", [ "s22y11v", "height:28px" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const dogfood_text = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk4ij", "font-size:15px" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const dogfood_cta = [ [ new Map([ [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const footer_block = [ [ new Map([ [ "::border-top", [ "::border-top", [ "s159z6e3", "border-top:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::padding-top", [ "::padding-top", [ "sxfkz7k", "padding-top:128px" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1ill0x0", "padding-bottom:128px" ] ] ] ]) ] ];
const footer_grid = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyv8", "gap:var(--space-8)" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s18vdyd9", "grid-template-columns:2fr 1fr 1fr 1fr" ] ] ] ]) ] ];
const footer_head = [ [ new Map([ [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qru", "margin-top:var(--space-2)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ] ]) ] ];
const footer_list = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ] ]) ] ];
const footer_link = [ [ new Map([ [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4eu", "opacity:0.7" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "srapg3a", "opacity:1" ] ] ], [ ":hover:text-decoration", [ ":hover:text-decoration", [ "s10pnzzh", "text-decoration:underline" ] ] ] ]) ] ];
const footer_mark = [ [ new Map([ [ "::align-self", [ "::align-self", [ "s1dnt31w", "align-self:center" ] ] ], [ "::justify-self", [ "::justify-self", [ "s1mm88t6", "justify-self:center" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const footer_micro = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ "szotvx1", "flex-wrap:wrap" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::border-top", [ "::border-top", [ "s159z6e3", "border-top:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::margin-top", [ "::margin-top", [ "s83cg9u", "margin-top:96px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxs0", "padding-top:var(--space-6)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyn8", "padding-bottom:var(--space-6)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ] ]) ] ];
const art_stage = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::background-color", [ "::background-color", [ "s1dcp4lt", "background-color:#120004" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const art_card = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background", [ "::background", [ "s1tk27gx", "background:rgba(27, 6, 13, 0.88)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1avk2", "border-radius:14px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxq6", "padding-top:var(--space-4)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "sr6lxyj", "box-shadow:0 8px 40px rgba(0, 0, 0, 0.45)" ] ] ] ]) ] ];
const art_tab = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk15j", "font-size:11px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1ny1qxg", "letter-spacing:0.1em" ] ] ], [ "::text-transform", [ "::text-transform", [ "s1s2tj83", "text-transform:uppercase" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qru", "margin-top:var(--space-2)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ] ]) ] ];
const art_code = [ [ new Map([ [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s24ary3", "font-size:12.5px" ] ] ], [ "::line-height", [ "::line-height", [ "s9bu6v5", "line-height:1.7" ] ] ], [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ], [ "::color", [ "::color", [ "s1bibpkj", "color:rgba(249, 223, 231, 0.92)" ] ] ] ]) ] ];
const art_caption = [ [ new Map([ [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odiaav", "letter-spacing:0.04em" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qto", "margin-top:var(--space-4)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tki8", "margin-bottom:var(--space-4)" ] ] ] ]) ] ];
const dot_magenta = [ [ new Map([ [ "::width", [ "::width", [ "sgdl7ao", "width:9px" ] ] ], [ "::height", [ "::height", [ "s1wxwfsy", "height:9px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::background", [ "::background", [ "ssdthhf", "background:#8B2786" ] ] ] ]) ] ];
const dot_orange = [ [ new Map([ [ "::width", [ "::width", [ "sgdl7ao", "width:9px" ] ] ], [ "::height", [ "::height", [ "s1wxwfsy", "height:9px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::background", [ "::background", [ "s10st2wu", "background:#EB682E" ] ] ] ]) ] ];
const arrow_head_left = [ [ new Map([ [ "::width", [ "::width", [ "sgdl6gf", "width:8px" ] ] ], [ "::height", [ "::height", [ "s1wxweyp", "height:8px" ] ] ], [ "::background", [ "::background", [ "s10st2wu", "background:#EB682E" ] ] ], [ "::clip-path", [ "::clip-path", [ "s13bfwa8", "clip-path:polygon(100% 0, 0 50%, 100% 100%)" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ] ]) ] ];
const arrow_head_right_rose = [ [ new Map([ [ "::width", [ "::width", [ "sgdl6gf", "width:8px" ] ] ], [ "::height", [ "::height", [ "s1wxweyp", "height:8px" ] ] ], [ "::background", [ "::background", [ "s10jvgc0", "background:#E5AFD9" ] ] ], [ "::clip-path", [ "::clip-path", [ "sdy8hnu", "clip-path:polygon(0 0, 100% 50%, 0 100%)" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ] ]) ] ];
const arrow_head_right = [ [ new Map([ [ "::width", [ "::width", [ "sgdl6gf", "width:8px" ] ] ], [ "::height", [ "::height", [ "s1wxweyp", "height:8px" ] ] ], [ "::background", [ "::background", [ "s10st2wu", "background:#EB682E" ] ] ], [ "::clip-path", [ "::clip-path", [ "sdy8hnu", "clip-path:polygon(0 0, 100% 50%, 0 100%)" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ] ]) ] ];
const dg_blob_top = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "semvs7h", "left:30%" ] ] ], [ "::top", [ "::top", [ "s8i24vg", "top:-14%" ] ] ], [ "::width", [ "::width", [ "sgdl1ga", "width:42%" ] ] ], [ "::height", [ "::height", [ "s1wxwavk", "height:55%" ] ] ], [ "::background", [ "::background", [ "s12uoy0v", "background:radial-gradient(closest-side, rgba(178, 48, 86, 0.5), transparent)" ] ] ] ]) ] ];
const dg_blob_left = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "semvndb", "left:-8%" ] ] ], [ "::bottom", [ "::bottom", [ "s11gfv4k", "bottom:-18%" ] ] ], [ "::width", [ "::width", [ "sgdl0pp", "width:36%" ] ] ], [ "::height", [ "::height", [ "s1wxwast", "height:52%" ] ] ], [ "::background", [ "::background", [ "s314x3p", "background:radial-gradient(closest-side, rgba(103, 34, 131, 0.5), transparent)" ] ] ] ]) ] ];
const dg_blob_right = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::right", [ "::right", [ "svx3j4l", "right:-8%" ] ] ], [ "::bottom", [ "::bottom", [ "s11gfv0w", "bottom:-14%" ] ] ], [ "::width", [ "::width", [ "sgdl0rj", "width:38%" ] ] ], [ "::height", [ "::height", [ "s1wxwast", "height:52%" ] ] ], [ "::background", [ "::background", [ "s1sz3q4d", "background:radial-gradient(closest-side, rgba(235, 104, 46, 0.4), transparent)" ] ] ] ]) ] ];
const dg_source = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background", [ "::background", [ "s1tk27gx", "background:rgba(27, 6, 13, 0.88)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1avk2", "border-radius:14px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxq6", "padding-top:var(--space-4)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "sr6lxyj", "box-shadow:0 8px 40px rgba(0, 0, 0, 0.45)" ] ] ], [ "::max-width", [ "::max-width", [ "s1puqmpj", "max-width:460px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ] ]) ] ];
const dg_wire_zone = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::height", [ "::height", [ "s2310lv", "height:64px" ] ] ], [ "::display", [ "::display", [ "sbiv4i3", "display:none" ] ] ], [ "1024px::display", [ "1024px::display", [ "s1pon8d1", "display:block" ] ] ] ]) ] ];
const dg_wire_left = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::height", [ "::height", [ "s1wxw9x7", "height:2px" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::top", [ "::top", [ "s9a6ol", "top:8px" ] ] ], [ "::width", [ "::width", [ "s64rvxm", "width:210px" ] ] ], [ "::background", [ "::background", [ "s1p2xi8", "background:linear-gradient(to left, #B23056, #672283)" ] ] ], [ "::transform", [ "::transform", [ "sxyfb32", "transform:translateX(-40px) rotate(160deg)" ] ] ] ]) ] ];
const dg_wire_right = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::height", [ "::height", [ "s1wxw9x7", "height:2px" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::top", [ "::top", [ "s9a6ol", "top:8px" ] ] ], [ "::width", [ "::width", [ "s64rvxm", "width:210px" ] ] ], [ "::background", [ "::background", [ "sla4t6z", "background:linear-gradient(to right, #D84730, #EB682E)" ] ] ], [ "::transform", [ "::transform", [ "sllsl8", "transform:translateX(40px) rotate(20deg)" ] ] ] ]) ] ];
const dg_wire_label_left = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s23lcvu", "font-size:11.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1itpo6m", "color:#E5AFD9" ] ] ], [ "::top", [ "::top", [ "s8i65b9", "top:26px" ] ] ], [ "::left", [ "::left", [ "semvrgw", "left:24%" ] ] ] ]) ] ];
const dg_wire_label_right = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s23lcvu", "font-size:11.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1itpo6m", "color:#E5AFD9" ] ] ], [ "::top", [ "::top", [ "s8i65b9", "top:26px" ] ] ], [ "::right", [ "::right", [ "svx3n86", "right:24%" ] ] ] ]) ] ];
const dg_legs = [ [ new Map([ [ "::display", [ "::display", [ "sbipssh", "display:grid" ] ] ], [ "::gap", [ "::gap", [ "s8myyte", "gap:var(--space-6)" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qto", "margin-top:var(--space-4)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tki8", "margin-bottom:var(--space-4)" ] ] ], [ "::align-items", [ "::align-items", [ "s13ace9s", "align-items:stretch" ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ "s1tdau93", "grid-template-columns:1fr 230px 1fr" ] ] ] ]) ] ];
const dg_leg_head = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qru", "margin-top:var(--space-2)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ] ]) ] ];
const dg_leg_name = [ [ new Map([ [ "::font-family", [ "::font-family", [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayk4ij", "font-size:15px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ] ]) ] ];
const dg_leg_env = [ [ new Map([ [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "sayk15j", "font-size:11px" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4es", "opacity:0.5" ] ] ] ]) ] ];
const dg_mid = [ [ new Map([ [ "::display", [ "::display", [ "sbiv4i3", "display:none" ] ] ], [ "1024px::display", [ "1024px::display", [ "s10b6u2h", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1d7ek7w", "justify-content:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const dg_mid_label = [ [ new Map([ [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s23lcvu", "font-size:11.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1j2narg", "color:#EB682E" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const dg_mid_label_rose = [ [ new Map([ [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s23lcvu", "font-size:11.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1itpo6m", "color:#E5AFD9" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const dg_line_row = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ] ]) ] ];
const dg_line = [ [ new Map([ [ "::flex", [ "::flex", [ "skj5p4u", "flex:1" ] ] ], [ "::height", [ "::height", [ "s1wxw9x7", "height:2px" ] ] ], [ "::background", [ "::background", [ "s10st2wu", "background:#EB682E" ] ] ] ]) ] ];
const dg_line_dashed = [ [ new Map([ [ "::flex", [ "::flex", [ "skj5p4u", "flex:1" ] ] ], [ "::height", [ "::height", [ "s1wxw9x7", "height:2px" ] ] ], [ "::background", [ "::background", [ "s1fm6b22", "background:repeating-linear-gradient(90deg, #E5AFD9 0 5px, transparent 5px 11px)" ] ] ], [ "::animation", [ "::animation", [ "s1dyc7rh", "animation:dash-flow 1.6s linear infinite" ] ] ] ]) ] ];
const dg_note = [ [ new Map([ [ "::font-size", [ "::font-size", [ "sayk15j", "font-size:11px" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4et", "opacity:0.6" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const ed_blob_a = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "semvqiz", "left:10%" ] ] ], [ "::top", [ "::top", [ "s8i25m1", "top:-20%" ] ] ], [ "::width", [ "::width", [ "sgdl34s", "width:62%" ] ] ], [ "::height", [ "::height", [ "s1wxwbn2", "height:62%" ] ] ], [ "::background", [ "::background", [ "sncj2yc", "background:radial-gradient(closest-side, rgba(178, 48, 86, 0.55), transparent)" ] ] ] ]) ] ];
const ed_blob_b = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::right", [ "::right", [ "s1mwnm2q", "right:-14%" ] ] ], [ "::bottom", [ "::bottom", [ "s11gfvrh", "bottom:-20%" ] ] ], [ "::width", [ "::width", [ "sgdl1ls", "width:48%" ] ] ], [ "::height", [ "::height", [ "s1wxwatq", "height:53%" ] ] ], [ "::background", [ "::background", [ "s1razgoh", "background:radial-gradient(closest-side, rgba(235, 104, 46, 0.35), transparent)" ] ] ] ]) ] ];
const ed_window = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background", [ "::background", [ "snnm22x", "background:#180509" ] ] ], [ "::border", [ "::border", [ "spit99b", "border:1px solid rgba(249, 223, 231, 0.14)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1atvk", "border-radius:12px" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "s1j59bd6", "box-shadow:0 24px 80px rgba(0, 0, 0, 0.6)" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qvi", "margin-top:var(--space-6)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkk2", "margin-bottom:var(--space-6)" ] ] ] ]) ] ];
const ed_titlebar = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxp9", "padding-top:var(--space-3)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiykh", "padding-bottom:var(--space-3)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ], [ "::background", [ "::background", [ "sl1fjou", "background:rgba(249, 223, 231, 0.04)" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "snfxlie", "border-bottom:1px solid rgba(249, 223, 231, 0.08)" ] ] ] ]) ] ];
const ed_dot_red = [ [ new Map([ [ "::width", [ "::width", [ "s178fo2h", "width:11px" ] ] ], [ "::height", [ "::height", [ "s22x3fv", "height:11px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ "::background", [ "::background", [ "szyeixo", "background:#D84730" ] ] ] ]) ] ];
const ed_dot_orange = [ [ new Map([ [ "::width", [ "::width", [ "s178fo2h", "width:11px" ] ] ], [ "::height", [ "::height", [ "s22x3fv", "height:11px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ "::background", [ "::background", [ "s10st2wu", "background:#EB682E" ] ] ] ]) ] ];
const ed_dot_magenta = [ [ new Map([ [ "::width", [ "::width", [ "s178fo2h", "width:11px" ] ] ], [ "::height", [ "::height", [ "s22x3fv", "height:11px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1nw", "opacity:0.85" ] ] ], [ "::background", [ "::background", [ "ssdthhf", "background:#8B2786" ] ] ] ]) ] ];
const ed_title = [ [ new Map([ [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ] ]) ] ];
const ed_body = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxq6", "padding-top:var(--space-4)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ], [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq90yh", "line-height:24px" ] ] ] ]) ] ];
const ed_gutter = [ [ new Map([ [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ], [ "::width", [ "::width", [ "s178i1rz", "width:44px" ] ] ], [ "::text-align", [ "::text-align", [ "s1czd0mf", "text-align:right" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t31ia", "padding-right:16px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1ih", "opacity:0.28" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const ed_code = [ [ new Map([ [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ], [ "::color", [ "::color", [ "s1bibpkj", "color:rgba(249, 223, 231, 0.92)" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ] ]) ] ];
const ed_squiggle = [ [ new Map([ [ "::text-decoration", [ "::text-decoration", [ "s18bszkp", "text-decoration:underline wavy #D84730 1.5px" ] ] ], [ "::text-underline-offset", [ "::text-underline-offset", [ "s1jf3sec", "text-underline-offset:5px" ] ] ] ]) ] ];
const ed_caret = [ [ new Map([ [ "::display", [ "::display", [ "sfatq7m", "display:inline-block" ] ] ], [ "::width", [ "::width", [ "sgdl1ex", "width:2px" ] ] ], [ "::height", [ "::height", [ "s22x6sv", "height:15px" ] ] ], [ "::background", [ "::background", [ "s11a28uv", "background:#F9DFE7" ] ] ], [ "::vertical-align", [ "::vertical-align", [ "s18wji4a", "vertical-align:text-bottom" ] ] ], [ "::margin-left", [ "::margin-left", [ "szjsw2c", "margin-left:1px" ] ] ], [ "::animation", [ "::animation", [ "s1fjlvgr", "animation:caret-blink 1.1s step-start infinite" ] ] ] ]) ] ];
const ed_hover = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::left", [ "::left", [ "s1ypvw5g", "left:clamp(120px, 30%, 185px)" ] ] ], [ "::top", [ "::top", [ "s1vku06o", "top:300px" ] ] ], [ "::width", [ "::width", [ "s1o8o1ug", "width:min(400px, 70%)" ] ] ], [ "::background", [ "::background", [ "so6ofbo", "background:#22080f" ] ] ], [ "::border", [ "::border", [ "spit9cz", "border:1px solid rgba(249, 223, 231, 0.18)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1as72", "border-radius:10px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxp9", "padding-top:var(--space-3)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiykh", "padding-bottom:var(--space-3)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "s1mshxdv", "box-shadow:0 16px 48px rgba(0, 0, 0, 0.55)" ] ] ], [ "::z-index", [ "::z-index", [ "sehvv7j", "z-index:2" ] ] ] ]) ] ];
const ed_hover_error = [ [ new Map([ [ "::font-size", [ "::font-size", [ "s24ary3", "font-size:12.5px" ] ] ], [ "::line-height", [ "::line-height", [ "s9bu6v4", "line-height:1.6" ] ] ], [ "::color", [ "::color", [ "s1i88qsa", "color:#D84730" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ] ]) ] ];
const ed_hover_from = [ [ new Map([ [ "::margin-top", [ "::margin-top", [ "snx6qru", "margin-top:var(--space-2)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk15j", "font-size:11px" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1k8", "opacity:0.45" ] ] ] ]) ] ];
const ed_statusbar = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxoc", "padding-top:var(--space-2)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ], [ "::font-size", [ "::font-size", [ "sayk15j", "font-size:11px" ] ] ], [ "::border-top", [ "::border-top", [ "s159z5r6", "border-top:1px solid rgba(249, 223, 231, 0.08)" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ] ]) ] ];
const ed_problem = [ [ new Map([ [ "::color", [ "::color", [ "s1i88qsa", "color:#D84730" ] ] ] ]) ] ];
const ed_status_right = [ [ new Map([ [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ] ]) ] ];
const tc_wrap = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::width", [ "::width", [ "s667hsd", "width:420px" ] ] ], [ "::height", [ "::height", [ "s1wqggao", "height:430px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::background-color", [ "::background-color", [ "s1dcp4lt", "background-color:#120004" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const tc_blob_a = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "semvqqb", "left:18%" ] ] ], [ "::top", [ "::top", [ "s99zzy", "top:22%" ] ] ], [ "::width", [ "::width", [ "sgdl36m", "width:64%" ] ] ], [ "::height", [ "::height", [ "s1wxwayb", "height:58%" ] ] ], [ "::background", [ "::background", [ "s168mq74", "background:radial-gradient(closest-side, rgba(178, 48, 86, 0.6), transparent)" ] ] ] ]) ] ];
const tc_blob_b = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "s1xbl9by", "left:4%" ] ] ], [ "::top", [ "::top", [ "s1fnzz8s", "top:2%" ] ] ], [ "::width", [ "::width", [ "sgdl1i4", "width:44%" ] ] ], [ "::height", [ "::height", [ "s1wxw9yk", "height:42%" ] ] ], [ "::background", [ "::background", [ "s1stxh3a", "background:radial-gradient(closest-side, rgba(139, 39, 134, 0.5), transparent)" ] ] ] ]) ] ];
const tc_blob_c = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::right", [ "::right", [ "svx3j0x", "right:-4%" ] ] ], [ "::bottom", [ "::bottom", [ "sv9p3z1", "bottom:-2%" ] ] ], [ "::width", [ "::width", [ "sgdl1jy", "width:46%" ] ] ], [ "::height", [ "::height", [ "s1wxwa28", "height:46%" ] ] ], [ "::background", [ "::background", [ "sx0q6gi", "background:radial-gradient(closest-side, rgba(235, 104, 46, 0.45), transparent)" ] ] ] ]) ] ];
const tc_spoke_up = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background", [ "::background", [ "sl1flbi", "background:rgba(249, 223, 231, 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s8i9ux0", "top:70px" ] ] ], [ "::width", [ "::width", [ "sgdl0ko", "width:1px" ] ] ], [ "::height", [ "::height", [ "s1wod31f", "height:145px" ] ] ] ]) ] ];
const tc_spoke_down = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background", [ "::background", [ "sl1flbi", "background:rgba(249, 223, 231, 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s1vk5h1x", "top:215px" ] ] ], [ "::width", [ "::width", [ "sgdl0ko", "width:1px" ] ] ], [ "::height", [ "::height", [ "s1wod31f", "height:145px" ] ] ] ]) ] ];
const tc_spoke_run = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background", [ "::background", [ "sl1flbi", "background:rgba(249, 223, 231, 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s1vk5h1x", "top:215px" ] ] ], [ "::width", [ "::width", [ "s645n5d", "width:154px" ] ] ], [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::transform", [ "::transform", [ "s1cmm6dq", "transform:rotate(-28.2deg)" ] ] ] ]) ] ];
const tc_spoke_fmt = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background", [ "::background", [ "sl1flbi", "background:rgba(249, 223, 231, 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s1vk5h1x", "top:215px" ] ] ], [ "::width", [ "::width", [ "s645mb4", "width:153px" ] ] ], [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::transform", [ "::transform", [ "s1rnupr9", "transform:rotate(28.6deg)" ] ] ] ]) ] ];
const tc_spoke_lsp = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background", [ "::background", [ "sl1flbi", "background:rgba(249, 223, 231, 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s1vk5h1x", "top:215px" ] ] ], [ "::width", [ "::width", [ "s645jsd", "width:150px" ] ] ], [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::transform", [ "::transform", [ "ss7z4r2", "transform:rotate(151deg)" ] ] ] ]) ] ];
const tc_spoke_upgrade = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::background", [ "::background", [ "sl1flbi", "background:rgba(249, 223, 231, 0.22)" ] ] ], [ "::transform-origin", [ "::transform-origin", [ "soitk1p", "transform-origin:left center" ] ] ], [ "::left", [ "::left", [ "sr9jof4", "left:210px" ] ] ], [ "::top", [ "::top", [ "s1vk5h1x", "top:215px" ] ] ], [ "::width", [ "::width", [ "s644xxv", "width:147px" ] ] ], [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::transform", [ "::transform", [ "s1tbwy2j", "transform:rotate(-150.3deg)" ] ] ] ]) ] ];
const tc_chip = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::transform", [ "::transform", [ "skw0huo", "transform:translate(-50%, -50%)" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myypq", "gap:var(--space-2)" ] ] ], [ "::background", [ "::background", [ "s1tk285o", "background:rgba(27, 6, 13, 0.92)" ] ] ], [ "::border", [ "::border", [ "spit9b5", "border:1px solid rgba(249, 223, 231, 0.16)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1t4wgdk", "border-radius:999px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxoc", "padding-top:var(--space-2)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ], [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s24ary3", "font-size:12.5px" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "s61cbz", "box-shadow:0 6px 28px rgba(0, 0, 0, 0.45)" ] ] ], [ "::white-space", [ "::white-space", [ "s1ctk0je", "white-space:nowrap" ] ] ] ]) ] ];
const led = [ [ new Map([ [ "::width", [ "::width", [ "sgdl5m6", "width:7px" ] ] ], [ "::height", [ "::height", [ "s1wxwe4g", "height:7px" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ "s1lr51x", "flex-shrink:0" ] ] ] ]) ] ];
const tc_center_mask = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::top", [ "::top", [ "s9a2gv", "top:50%" ] ] ], [ "::transform", [ "::transform", [ "skw0huo", "transform:translate(-50%, -50%)" ] ] ], [ "::width", [ "::width", [ "s64uyum", "width:250px" ] ] ], [ "::height", [ "::height", [ "s1wocyu6", "height:140px" ] ] ], [ "::background", [ "::background", [ "s16st4mq", "background:radial-gradient(closest-side, #120004d6 35%, transparent)" ] ] ] ]) ] ];
const tc_center = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::top", [ "::top", [ "s9a2gv", "top:50%" ] ] ], [ "::transform", [ "::transform", [ "skw0huo", "transform:translate(-50%, -50%)" ] ] ], [ "::width", [ "::width", [ "s644s24", "width:140px" ] ] ], [ "::height", [ "::height", [ "s23znoa", "height:auto" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const df_wrap = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::background-color", [ "::background-color", [ "s1dcp4lt", "background-color:#120004" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxtu", "padding-top:var(--space-8)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyp2", "padding-bottom:var(--space-8)" ] ] ], [ "::display", [ "::display", [ "sbiv4i3", "display:none" ] ] ], [ "1024px::display", [ "1024px::display", [ "s1pon8d1", "display:block" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const df_blob_a = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::left", [ "::left", [ "s1xbl9a4", "left:2%" ] ] ], [ "::top", [ "::top", [ "s8i26ga", "top:-30%" ] ] ], [ "::width", [ "::width", [ "sgdl0k7", "width:30%" ] ] ], [ "::height", [ "::height", [ "s22x2l5", "height:120%" ] ] ], [ "::background", [ "::background", [ "s1mk96oq", "background:radial-gradient(closest-side, rgba(139, 39, 134, 0.45), transparent)" ] ] ] ]) ] ];
const df_blob_b = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jge7", "border-radius:50%" ] ] ], [ "::filter", [ "::filter", [ "sc4alkf", "filter:blur(60px)" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::right", [ "::right", [ "smhpc5c", "right:0%" ] ] ], [ "::top", [ "::top", [ "s8i25m1", "top:-20%" ] ] ], [ "::width", [ "::width", [ "sgdl0nv", "width:34%" ] ] ], [ "::height", [ "::height", [ "s22x2l5", "height:120%" ] ] ], [ "::background", [ "::background", [ "s1i555w2", "background:radial-gradient(closest-side, rgba(216, 71, 48, 0.5), transparent)" ] ] ] ]) ] ];
const df_row = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ] ]) ] ];
const df_node = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background", [ "::background", [ "s1tk27gx", "background:rgba(27, 6, 13, 0.88)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1atvk", "border-radius:12px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxq6", "padding-top:var(--space-4)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "sr6lxyj", "box-shadow:0 8px 40px rgba(0, 0, 0, 0.45)" ] ] ] ]) ] ];
const df_node_lit = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::background", [ "::background", [ "s1tk27gx", "background:rgba(27, 6, 13, 0.88)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "sh1atvk", "border-radius:12px" ] ] ], [ "::padding-top", [ "::padding-top", [ "stbzxq6", "padding-top:var(--space-4)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ], [ "::padding-left", [ "::padding-left", [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ], [ "::padding-right", [ "::padding-right", [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ], [ "::box-shadow", [ "::box-shadow", [ "s159n1au", "box-shadow:0 0 34px rgba(235, 104, 46, 0.25), 0 8px 32px rgba(0, 0, 0, 0.45)" ] ] ], [ "::border-color", [ "::border-color", [ "szklxfl", "border-color:rgba(235, 104, 46, 0.6)" ] ] ] ]) ] ];
const df_tag = [ [ new Map([ [ "::font-size", [ "::font-size", [ "s22vxtl", "font-size:10.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1ny1qxg", "letter-spacing:0.1em" ] ] ], [ "::text-transform", [ "::text-transform", [ "s1s2tj83", "text-transform:uppercase" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4es", "opacity:0.5" ] ] ], [ "::margin-top", [ "::margin-top", [ "snx6qqx", "margin-top:var(--space-1)" ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ "s1c0tkfh", "margin-bottom:var(--space-1)" ] ] ] ]) ] ];
const df_arrow = [ [ new Map([ [ "::flex", [ "::flex", [ "skj5p4u", "flex:1" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyot", "gap:var(--space-1)" ] ] ] ]) ] ];
const df_arrow_label = [ [ new Map([ [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "s23lcvu", "font-size:11.5px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s1j2narg", "color:#EB682E" ] ] ] ]) ] ];
const df_arrow_row = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::width", [ "::width", [ "s178flj9", "width:100%" ] ] ] ]) ] ];
const code_pre = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dnzynr", "background-color:#1B060D" ] ] ], [ "::border-radius", [ "::border-radius", [ "s1r3y9sl", "border-radius:var(--space-3)" ] ] ], [ "::padding", [ "::padding", [ "s1ufvrz", "padding:var(--space-5)" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::overflow", [ "::overflow", [ "s19aluk0", "overflow:auto" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ], [ "::line-height", [ "::line-height", [ "snq82np", "line-height:1.65" ] ] ], [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::white-space", [ "::white-space", [ "s1oc7mru", "white-space:pre" ] ] ] ]) ] ];
const tk_keyword = [ [ new Map([ [ "::color", [ "::color", [ "s1j2narg", "color:#EB682E" ] ] ] ]) ] ];
const tk_string = [ [ new Map([ [ "::color", [ "::color", [ "s1itpo6m", "color:#E5AFD9" ] ] ] ]) ] ];
const tk_plain = [ [ new Map([ [ "::opacity", [ "::opacity", [ "s30a1oq", "opacity:0.92" ] ] ] ]) ] ];
const tk_callable = [ [ new Map([ [ "::color", [ "::color", [ "s1jdh1v1", "color:#F0A886" ] ] ] ]) ] ];
const tk_type = [ [ new Map([ [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ] ]) ] ];
const tk_hole = [ [ new Map([ [ "::color", [ "::color", [ "s1j2narg", "color:#EB682E" ] ] ] ]) ] ];
const leaf_style = [ [ new Map([ [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::background", [ "::background", [ "s1seocvu", "background:rgba(27, 6, 13, 0.9)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::padding", [ "::padding", [ "s138lk5w", "padding:1px 6px" ] ] ], [ "::white-space", [ "::white-space", [ "s1ctk0je", "white-space:nowrap" ] ] ] ]) ] ];
const leaf_link_style = [ [ new Map([ [ "::font-family", [ "::font-family", [ "s13ygf9q", "font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ], [ "::font-size", [ "::font-size", [ "sayk1zs", "font-size:12px" ] ] ], [ "::background", [ "::background", [ "s1seocvu", "background:rgba(27, 6, 13, 0.9)" ] ] ], [ "::border", [ "::border", [ "spit95n", "border:1px solid rgba(249, 223, 231, 0.10)" ] ] ], [ "::border-radius", [ "::border-radius", [ "s94jixf", "border-radius:6px" ] ] ], [ "::padding", [ "::padding", [ "s138lk5w", "padding:1px 6px" ] ] ], [ "::white-space", [ "::white-space", [ "s1ctk0je", "white-space:nowrap" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "st97zqd", "text-decoration:underline dotted rgba(235, 104, 46, 0.7) 1px" ] ] ], [ "::text-underline-offset", [ "::text-underline-offset", [ "s1jf3qpu", "text-underline-offset:3px" ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ "szh62f9", "border-color:rgba(235, 104, 46, 0.6)" ] ] ] ]) ] ];
const topbar = [ [ new Map([ [ "::position", [ "::position", [ "s1onro1c", "position:sticky" ] ] ], [ "::top", [ "::top", [ "s80ttlx", "top:0" ] ] ], [ "::z-index", [ "::z-index", [ "si5ywm6", "z-index:100" ] ] ], [ "::background", [ "::background", [ "s10uy5mh", "background:rgba(18, 0, 4, calc(var(--nav-fade, 0) * 0.86))" ] ] ], [ "::border-bottom", [ "::border-bottom", [ "s143oef3", "border-bottom:1px solid rgba(249, 223, 231, calc(var(--nav-fade, 0) * 0.10))" ] ] ], [ "::backdrop-filter", [ "::backdrop-filter", [ "shx44pg", "backdrop-filter:blur(calc(var(--nav-fade, 0) * 14px))" ] ] ] ]) ] ];
const nav_row = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::justify-content", [ "::justify-content", [ "s1yv3ji6", "justify-content:space-between" ] ] ], [ "::height", [ "::height", [ "s2310lv", "height:64px" ] ] ] ]) ] ];
const nav_brand = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::gap", [ "::gap", [ "s8myyqn", "gap:var(--space-3)" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ "s1odkmbv", "letter-spacing:0.35em" ] ] ], [ "::font-size", [ "::font-size", [ "sayk2u1", "font-size:13px" ] ] ] ]) ] ];
const nav_links = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::gap", [ "::gap", [ "s8myyte", "gap:var(--space-6)" ] ] ] ]) ] ];
const nav_link = [ [ new Map([ [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::opacity", [ "::opacity", [ "s3a4ev", "opacity:0.8" ] ] ], [ "::text-decoration", [ "::text-decoration", [ "svrgm1f", "text-decoration:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ "srapg3a", "opacity:1" ] ] ] ]) ] ];
const bloom_field = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::top", [ "::top", [ "s80ttlx", "top:0" ] ] ], [ "::left", [ "::left", [ "s8k3705", "left:0" ] ] ], [ "::width", [ "::width", [ "s178flj9", "width:100%" ] ] ], [ "::height", [ "::height", [ "sbp2tui", "height:calc(64px + clamp(1100px, 100vw, 1920px) * 0.570864)" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const bloom_drift = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::inset", [ "::inset", [ "s1ucbaf9", "inset:0" ] ] ], [ "::animation", [ "::animation", [ "s1u16gt0", "animation:bloom-drift-a 44s ease-in-out infinite alternate" ] ] ] ]) ] ];
const bloom_blurwrap = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::inset", [ "::inset", [ "s1ucbaf9", "inset:0" ] ] ], [ "::filter", [ "::filter", [ "sdxlu80", "filter:blur(calc(clamp(1100px, 100vw, 1920px) * 0.052)) saturate(1.25) brightness(1.12) url(#bloom-texture)" ] ] ] ]) ] ];
const bloom_gradient = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::transform", [ "::transform", [ "s183tt1x", "transform:translateX(-50%)" ] ] ], [ "::top", [ "::top", [ "s1ppzw09", "top:calc(64px - clamp(1100px, 100vw, 1920px) * 0.049226)" ] ] ], [ "::width", [ "::width", [ "s183om2p", "width:clamp(1100px, 100vw, 1920px)" ] ] ], [ "::height", [ "::height", [ "sst8zpc", "height:calc(clamp(1100px, 100vw, 1920px) * 0.62009)" ] ] ], [ "::-webkit-mask-size", [ "::-webkit-mask-size", [ "sdml5s3", "-webkit-mask-size:100% 100%" ] ] ], [ "::mask-size", [ "::mask-size", [ "s14catfn", "mask-size:100% 100%" ] ] ], [ "::-webkit-mask-image", [ "::-webkit-mask-image", [ "ss9iuu0", "-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E  %3C/svg%3E \")" ] ] ], [ "::mask-image", [ "::mask-image", [ "sk413s", "mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E  %3C/svg%3E \")" ] ] ], [ "::background-image", [ "::background-image", [ "suvh1z8", "background-image:radial-gradient(30% 10% ellipse at 61% 24%, rgb(226 184 231), rgb(247 229 249 / 70%) 74%, transparent 80%), radial-gradient(42% 40% ellipse at 62% 40%, rgb(255 106 0 / 95%), rgb(217 118 48 / 65%) 50%, transparent 78%), radial-gradient(61% 67% ellipse at 23% 48%, rgb(175 38 168 / 95%), rgb(237 64 7 / 60%) 45%, transparent 76%), radial-gradient(40% 46% ellipse at 92% 48%, rgba(216, 71, 48, 0.95), rgba(216, 71, 48, 0.7) 45%, transparent 78%), radial-gradient(26% 40% ellipse at 2% 50%, rgba(216, 71, 48, 0.9), transparent 74%), radial-gradient(36% 26% ellipse at 45% 78%, rgba(178, 48, 86, 0.7), transparent 76%), radial-gradient(22% 20% ellipse at 20% 84%, rgba(103, 34, 131, 0.8), transparent 74%), linear-gradient(100deg, #95304d 0%, #8B2786 25%, #EB682E 55%, #D84730 85%, #D84730 100%)" ] ] ], [ "::background-size", [ "::background-size", [ "s1as7syx", "background-size:calc(clamp(1100px, 100vw, 1920px) * 0.78125) calc(clamp(1100px, 100vw, 1920px) * 0.78125)" ] ] ] ]) ] ];
const bloom_duo = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::left", [ "::left", [ "semvtvz", "left:50%" ] ] ], [ "::transform", [ "::transform", [ "s183tt1x", "transform:translateX(-50%)" ] ] ], [ "::top", [ "::top", [ "s1ppzw09", "top:calc(64px - clamp(1100px, 100vw, 1920px) * 0.049226)" ] ] ], [ "::width", [ "::width", [ "s183om2p", "width:clamp(1100px, 100vw, 1920px)" ] ] ], [ "::height", [ "::height", [ "sst8zpc", "height:calc(clamp(1100px, 100vw, 1920px) * 0.62009)" ] ] ], [ "::-webkit-mask-size", [ "::-webkit-mask-size", [ "sdml5s3", "-webkit-mask-size:100% 100%" ] ] ], [ "::mask-size", [ "::mask-size", [ "s14catfn", "mask-size:100% 100%" ] ] ], [ "::-webkit-mask-image", [ "::-webkit-mask-image", [ "sthis8v", "-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg filter=\'url(%23filter0_f_51_26)\'%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E %3Cdefs%3E %3Cfilter id=\'filter0_f_51_26\' x=\'0\' y=\'-92.4345\' width=\'1877.72\' height=\'1164.39\' filterUnits=\'userSpaceOnUse\' color-interpolation-filters=\'sRGB\'%3E %3CfeFlood flood-opacity=\'0\' result=\'BackgroundImageFix\'/%3E %3CfeBlend mode=\'normal\' in=\'SourceGraphic\' in2=\'BackgroundImageFix\' result=\'shape\'/%3E %3CfeGaussianBlur stdDeviation=\'100\' result=\'effect1_foregroundBlur_51_26\'/%3E %3C/filter%3E %3C/defs%3E %3C/svg%3E \")" ] ] ], [ "::mask-image", [ "::mask-image", [ "sfm8fb3", "mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg filter=\'url(%23filter0_f_51_26)\'%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E %3Cdefs%3E %3Cfilter id=\'filter0_f_51_26\' x=\'0\' y=\'-92.4345\' width=\'1877.72\' height=\'1164.39\' filterUnits=\'userSpaceOnUse\' color-interpolation-filters=\'sRGB\'%3E %3CfeFlood flood-opacity=\'0\' result=\'BackgroundImageFix\'/%3E %3CfeBlend mode=\'normal\' in=\'SourceGraphic\' in2=\'BackgroundImageFix\' result=\'shape\'/%3E %3CfeGaussianBlur stdDeviation=\'100\' result=\'effect1_foregroundBlur_51_26\'/%3E %3C/filter%3E %3C/defs%3E %3C/svg%3E \")" ] ] ], [ "::background-image", [ "::background-image", [ "s13ldclz", "background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E %3Cfilter id=\'d\' x=\'0\' y=\'0\' width=\'100%25\' height=\'100%25\' color-interpolation-filters=\'sRGB\'%3E %3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'2\' numOctaves=\'3\' seed=\'3214\' stitchTiles=\'stitch\' result=\'n\'/%3E %3CfeColorMatrix in=\'n\' type=\'matrix\' values=\'1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1\' result=\'n1\'/%3E %3CfeColorMatrix in=\'n1\' type=\'luminanceToAlpha\' result=\'a\'/%3E %3CfeComponentTransfer in=\'a\' result=\'m1\'%3E%3CfeFuncA type=\'discrete\' tableValues=\'1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\'/%3E%3C/feComponentTransfer%3E %3CfeFlood flood-color=\'%23262324\' result=\'f1\'/%3E %3CfeComposite in=\'f1\' in2=\'m1\' operator=\'in\' result=\'dark\'/%3E %3CfeComponentTransfer in=\'a\' result=\'m2\'%3E%3CfeFuncA type=\'discrete\' tableValues=\'0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\'/%3E%3C/feComponentTransfer%3E %3CfeFlood flood-color=\'rgba(255, 89, 0, 0.57)\' result=\'f2\'/%3E %3CfeComposite in=\'f2\' in2=\'m2\' operator=\'in\' result=\'orange\'/%3E %3CfeMerge%3E%3CfeMergeNode in=\'dark\'/%3E%3CfeMergeNode in=\'orange\'/%3E%3C/feMerge%3E %3C/filter%3E %3Crect width=\'120\' height=\'120\' filter=\'url(%2523d)\'/%3E %3C/svg%3E\")" ] ] ], [ "::background-size", [ "::background-size", [ "skugn91", "background-size:120px 120px" ] ] ], [ "::mix-blend-mode", [ "::mix-blend-mode", [ "s1ddx1v8", "mix-blend-mode:soft-light" ] ] ] ]) ] ];
const masthead_wrap = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ] ]) ] ];
const hero_block = [ [ new Map([ [ "::position", [ "::position", [ "s16f1e6t", "position:relative" ] ] ], [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::align-items", [ "::align-items", [ "s1rpzmas", "align-items:center" ] ] ], [ "::height", [ "::height", [ "ss654zr", "height:calc(clamp(1100px, 100vw, 1920px) * 0.52917)" ] ] ], [ "::padding-top", [ "::padding-top", [ "srk904b", "padding-top:calc(clamp(1100px, 100vw, 1920px) * 0.15208)" ] ] ], [ "::gap", [ "::gap", [ "s1pnyybd", "gap:calc(clamp(1100px, 100vw, 1920px) * 0.03333)" ] ] ], [ "::box-sizing", [ "::box-sizing", [ "s9fgd5j", "box-sizing:border-box" ] ] ] ]) ] ];
const hero_mark = [ [ new Map([ [ "::width", [ "::width", [ "s1t71824", "width:calc(clamp(1100px, 100vw, 1920px) * 0.05208)" ] ] ], [ "::height", [ "::height", [ "s23znoa", "height:auto" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const hero_wordmark = [ [ new Map([ [ "::width", [ "::width", [ "s1tv0w0m", "width:calc(clamp(1100px, 100vw, 1920px) * 0.16198)" ] ] ], [ "::height", [ "::height", [ "s23znoa", "height:auto" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const hero_tagline = [ [ new Map([ [ "::font-family", [ "::font-family", [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "s169txcv", "font-size:max(18px, clamp(1100px, 100vw, 1920px) * 0.01667)" ] ] ], [ "::line-height", [ "::line-height", [ "s9bu6v3", "line-height:1.5" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::color", [ "::color", [ "s15t7ncn", "color:#120004" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::text-align", [ "::text-align", [ "s17ya8sq", "text-align:center" ] ] ] ]) ] ];
const assets = "https://vilan-lang.org/assets";
const repo = "https://github.com/vilan-lang/vilan";
const shell = [ [ new Map([ [ "::background-color", [ "::background-color", [ "s1dcp4lt", "background-color:#120004" ] ] ], [ "::color", [ "::color", [ "s1jjwgph", "color:#F9DFE7" ] ] ], [ "::min-height", [ "::min-height", [ "sondrfd", "min-height:100%" ] ] ], [ "::font-family", [ "::font-family", [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayk3oa", "font-size:14px" ] ] ], [ "::line-height", [ "::line-height", [ "snq8cl8", "line-height:18px" ] ] ] ]) ] ];
const column = [ [ new Map([ [ "::max-width", [ "::max-width", [ "s1eamei2", "max-width:1264px" ] ] ], [ "::margin-left", [ "::margin-left", [ "s10oplpw", "margin-left:auto" ] ] ], [ "::margin-right", [ "::margin-right", [ "sp4tc1m", "margin-right:auto" ] ] ], [ "::padding-left", [ "::padding-left", [ "s1vtg8d6", "padding-left:32px" ] ] ], [ "::padding-right", [ "::padding-right", [ "s16t4hls", "padding-right:32px" ] ] ] ]) ] ];
const no_drag = [ [ new Map([ [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ]) ] ];
const section_block = [ [ new Map([ [ "::padding-top", [ "::padding-top", [ "s18lh5xs", "padding-top:var(--space-24)" ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ "s1v942yc", "padding-bottom:var(--space-24)" ] ] ] ]) ] ];
const stack = [ [ new Map([ [ "::display", [ "::display", [ "sbiovxm", "display:flex" ] ] ], [ "::flex-direction", [ "::flex-direction", [ "s1atdsbb", "flex-direction:column" ] ] ], [ "::gap", [ "::gap", [ "s8myyrk", "gap:var(--space-4)" ] ] ] ]) ] ];
const reveal = [ [ new Map([ [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const heading = [ [ new Map([ [ "::font-family", [ "::font-family", [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ], [ "::font-size", [ "::font-size", [ "sayllga", "font-size:32px" ] ] ], [ "::line-height", [ "::line-height", [ "snqanrz", "line-height:48px" ] ] ], [ "::font-weight", [ "::font-weight", [ "skjzgjh", "font-weight:600" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const lead = [ [ new Map([ [ "::opacity", [ "::opacity", [ "s30a1nt", "opacity:0.82" ] ] ], [ "::max-width", [ "::max-width", [ "s1pu2qte", "max-width:36rem" ] ] ], [ "::margin", [ "::margin", [ "s1tlfgp4", "margin:var(--space-0)" ] ] ], [ "::--reveal", [ "::--reveal", [ "s1wraoya", "--reveal:1" ] ] ] ]) ] ];
const rule_line = [ [ new Map([ [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::background", [ "::background", [ "sl1fkff", "background:rgba(249, 223, 231, 0.10)" ] ] ] ]) ] ];
const grain_overlay = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::inset", [ "::inset", [ "s1ucbaf9", "inset:0" ] ] ], [ "::opacity", [ "::opacity", [ "s30a1l5", "opacity:0.55" ] ] ], [ "::mix-blend-mode", [ "::mix-blend-mode", [ "sc8sqhh", "mix-blend-mode:overlay" ] ] ], [ "::background-image", [ "::background-image", [ "s192ko3e", "background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'240\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'240\' height=\'240\' filter=\'url(%23n)\' opacity=\'0.55\'/%3E%3C/svg%3E\")" ] ] ], [ "::pointer-events", [ "::pointer-events", [ "s171fk3p", "pointer-events:none" ] ] ], [ "::user-select", [ "::user-select", [ "s1iy45h3", "user-select:none" ] ] ] ]) ] ];
const visually_hidden = [ [ new Map([ [ "::position", [ "::position", [ "s58iza0", "position:absolute" ] ] ], [ "::width", [ "::width", [ "sgdl0ko", "width:1px" ] ] ], [ "::height", [ "::height", [ "s1wxw92y", "height:1px" ] ] ], [ "::overflow", [ "::overflow", [ "syp1ckj", "overflow:hidden" ] ] ], [ "::clip-path", [ "::clip-path", [ "sx3450x", "clip-path:inset(50%)" ] ] ] ]) ] ];
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
let $bK = null;
if (!(reduced_motion)) {
	for (const target of targets) {
		if (target.getBoundingClientRect().top > viewport - 40.0) {
			target.style.setProperty("opacity", "0");
			target.style.setProperty("transform", "translateY(28px)");
		}
	}
	$bK = undefined;
}
$bK;
const publish = () => {
	return $as([ 1 ], ($bL) => {
		const progress = Math.max(Math.min(probe.scrollTop / 64.0, 1.0), 0.0);
		$ab(scroll_fade, "" + progress, [ 0, $bL ]);
		let $bM = null;
		if (!(reduced_motion)) {
			const line = probe.clientHeight * 0.92;
			for (const target2 of targets) {
				if (target2.getBoundingClientRect().top < line) {
					target2.style.setProperty("transition", "opacity 600ms ease, transform 600ms ease");
					target2.style.setProperty("opacity", "1");
					target2.style.setProperty("transform", "none");
				}
			}
			$bM = undefined;
		}
		return $bM;
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
