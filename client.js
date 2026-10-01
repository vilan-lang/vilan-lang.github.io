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
function __guarded(body) {
	try {
		body();
		return [ 1 ];
	} catch (error) {
		return [ 0, error && error.message ? error.message : String(error) ];
	}
}
function __hash(value) {
	return (typeof value === "object" && value !== null) ? JSON.stringify(value) : value;
}
function __hmr_active() {
	return typeof globalThis.__VILAN_HMR__ !== "undefined";
}
function __insert_at(list, index, value) {
	if (index >= 0 && index < list.length) return void list.splice(index, 0, value);
	if (index === list.length) return void list.push(value);
	throw "index out of bounds: the length is " + list.length + " but the index is " + index;
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
class __Nursery {
	constructor(parent) {
		this.children = [];
		this.failedTask = undefined;
		this.failWake = undefined;
		this.controller = new AbortController();
		if (parent) {
			const signal = parent.controller.signal;
			if (signal.aborted) this.controller.abort(signal.reason);
			else signal.addEventListener("abort", () => this.controller.abort(signal.reason), { once: true });
		}
	}
	cancel() {
		this.controller.abort();
	}
	__fail(task) {
		if (this.failedTask === undefined) {
			this.failedTask = task;
			this.controller.abort();
			if (this.failWake) this.failWake();
		}
	}
	is_cancelled() {
		return this.controller.signal.aborted;
	}
	signal_of() {
		return this.controller.signal;
	}
}
function __nursery_new(parent) {
	return new __Nursery(parent && parent[0] === 0 ? parent[1] : undefined);
}
function __nursery_new_detached() {
	const n = __nursery_new(undefined);
	n.detached = true;
	n.__fail = function (task) {
		if (!task.observed) {
			globalThis.setTimeout(() => {
				if (!task.observed) console.error("unhandled task error (spawned in " + task.origin + "): " + String(task.error));
			}, 0);
		}
	};
	return n;
}
function __nursery_is_cancel(error) {
	return !!error && error.name === "AbortError";
}
async function __nursery_run(n, body) {
	let result;
	let bodyError;
	let bodyFailed = false;
	try {
		result = await body();
	} catch (error) {
		bodyFailed = true;
		bodyError = error;
	}
	if (bodyFailed) n.controller.abort();
	const failed = new Promise((resolve) => {
		n.failWake = resolve;
		if (n.failedTask !== undefined) resolve();
	});
	let index = 0;
	while (!bodyFailed && n.failedTask === undefined && index < n.children.length) {
		try {
			await Promise.race([n.children[index], failed]);
		} catch (error) {}
		if (n.failedTask === undefined) index += 1;
	}
	if (!bodyFailed && n.failedTask === undefined) return result;
	for (const task of n.children) task.then(null, () => {});
	if (bodyFailed) throw bodyError;
	const winner = n.failedTask;
	throw typeof winner.error === "string" ? winner.error + " (in task spawned in " + winner.origin + ")" : winner.error;
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
function __with_finally(body, after) {
	try {
		body();
	} finally {
		after();
	}
}
function hash(self) {
	return __hash(self);
}
function hash2(self) {
	return __hash(self);
}
function fresh_id() {
	const id = next_subscriber_id.v;
	next_subscriber_id.v = id + 1;
	return id;
}
function mint_subscriber(notify) {
	const derived = minting_derivation.v;
	minting_derivation.v = false;
	return subscriber_of(notify, derived);
}
function subscriber_of(notify, derived) {
	return [ fresh_id(), notify, __shared_new(true), derived ];
}
function new2() {
	return [ __shared_new([  ]), __shared_new([  ]), __shared_new(new Map()), __shared_new(new Map()), __shared_new(false), __shared_new(false), __shared_new(false) ];
}
function is_quiescent(self) {
	return $M(self[0].v) && $M(self[1].v);
}
function enqueue(turn, subscribers) {
	for (const subscriber of subscribers) {
		const key = hash2(subscriber[0]);
		let $aB = null;
		if (subscriber[3]) {
			if (!(turn[3].v.has(key))) {
				turn[3].v.set(key, true);
				turn[1].v.push(__clone(subscriber));
			}
			$aB = undefined;
		} else if (!(turn[2].v.has(key))) {
			turn[2].v.set(key, true);
			let index = turn[0].v.length;
			while (index > 0 && __at(turn[0].v, index - 1)[0] > subscriber[0]) {
				index = index - 1;
			}
			__insert_at(turn[0].v, index, __clone(subscriber));
		}
		$aB;
	}
	if (turn[5].v && !(turn[6].v) && !(turn[4].v)) {
		turn[6].v = true;
		queueMicrotask(() => {
			turn[6].v = false;
			drain(turn);
			return;
		});
	}
}
function drain(turn) {
	if (!(turn[4].v)) {
		turn[4].v = true;
		draining_turns.v.push(__clone(turn));
		__with_finally(() => {
			let budget = 100000;
			while (!(is_quiescent(turn)) && budget > 0) {
				while (!($M(turn[1].v)) && budget > 0) {
					const derivations = turn[1].v;
					turn[1].v = [  ];
					turn[3].v = new Map();
					for (const subscriber of derivations) {
						if (subscriber[2].v) {
							subscriber[1]();
						}
						budget = budget - 1;
					}
				}
				const wave = turn[0].v;
				turn[0].v = [  ];
				turn[2].v = new Map();
				for (const subscriber2 of wave) {
					if (subscriber2[2].v) {
						subscriber2[1]();
					}
					budget = budget - 1;
				}
			}
			return;
		}, () => {
			__list_pop(draining_turns.v);
			turn[4].v = false;
			return;
		});
	}
}
function defer_subscriber(turn, subscriber) {
	const $cp = turn;
	let $cq = null;
	if ($cp[0] === 0) {
		const ambient = $cp[1];
		$cq = enqueue(ambient, [ reissued(subscriber) ]);
	} else {
		const $cr = $L(draining_turns.v);
		let $cs = null;
		if ($cr[0] === 0) {
			const draining = $cr[1];
			$cs = enqueue(draining, [ reissued(subscriber) ]);
		} else {
			if (subscriber[2].v) {
				subscriber[1]();
			}
			$cs = undefined;
		}
		$cq = $cs;
	}
	return $cq;
}
function reissued(subscriber) {
	return [ subscriber[0], subscriber[1], subscriber[2], subscriber[3] ];
}
function wake(subscriber) {
	defer_subscriber([ 1 ], subscriber);
}
function dispose(self, $I) {
	const $J = $I;
	let $K = null;
	if ($J[0] === 0) {
		const established = $J[1];
		$K = [ 0, established ];
	} else {
		$K = $L(draining_turns.v);
	}
	const ambient = $K;
	release_under(self, ambient);
}
function detach(handle) {
	const $cw = $ct(releasing_turns.v);
	let $cx = null;
	if ($cw[0] === 0) {
		const at_release = $cw[1];
		$cx = at_release;
	} else {
		$cx = $L(draining_turns.v);
	}
	const turn = $cx;
	release_under(handle, turn);
}
function release_under(handle, ambient) {
	handle[2].v = false;
	const $O = [ 0, handle[0] ];
	let $P = null;
	if ($O[0] === 0) {
		const subscribers = $O[1];
		let kept = [  ];
		for (const subscriber of subscribers.v) {
			if (subscriber[0] !== handle[1]) {
				kept.push(__clone(subscriber));
			}
		}
		subscribers.v = kept;
		$P = undefined;
	} else {
		$P = undefined;
	}
	$P;
	const $Q = ambient;
	let $R = null;
	if ($Q[0] === 0) {
		const turn = $Q[1];
		let kept_pending = [  ];
		for (const subscriber2 of turn[0].v) {
			if (subscriber2[0] !== handle[1]) {
				kept_pending.push(__clone(subscriber2));
			}
		}
		turn[0].v = kept_pending;
		turn[2].v.delete(hash2(handle[1]));
		let kept_derived = [  ];
		for (const subscriber3 of turn[1].v) {
			if (subscriber3[0] !== handle[1]) {
				kept_derived.push(__clone(subscriber3));
			}
		}
		turn[1].v = kept_derived;
		turn[3].v.delete(hash2(handle[1]));
		$R = undefined;
	} else {
		$R = undefined;
	}
	$R;
	const $S = handle[3].v;
	let $T = null;
	if ($S[0] === 0) {
		const release = $S[1];
		handle[3].v = [ 1 ];
		releasing_turns.v.push(ambient);
		__with_finally(release, () => {
			__list_pop(releasing_turns.v);
			return;
		});
		$T = undefined;
	} else {
		$T = undefined;
	}
	return $T;
}
function new3() {
	return [ __shared_new([ 0, no_cleanups, false, [ 1 ] ]), 0 ];
}
function is_disposed(self) {
	return self[0].v[0] !== self[1];
}
function defer(self, cleanup) {
	let $U = null;
	if (is_disposed(self)) {
		cleanup();
	} else {
		const held = __clone(self[0].v);
		if (held[2]) {
			held[1].v.push(cleanup);
		} else {
			owner_lists_allocated_count.v = owner_lists_allocated_count.v + 1;
			self[0].v = [ held[0], __shared_new([ cleanup ]), true, held[3] ];
		}
		$U = undefined;
	}
	return $U;
}
function renew(self, with_nursery) {
	const live = [ self[0], self[0].v[0] ];
	dispose2(live);
	const next = self[0].v[0];
	if (with_nursery) {
		const held = self[0].v;
		self[0].v = [ held[0], held[1], held[2], [ 0, detached_nursery() ] ];
	}
	return [ self[0], next ];
}
function nursery(self) {
	let $cb = null;
	if (is_disposed(self)) {
		$cb = [ 1 ];
	} else {
		$cb = self[0].v[3];
	}
	return $cb;
}
function dispose2(self) {
	let $ca = null;
	if (!(is_disposed(self))) {
		const held = self[0].v;
		self[0].v = [ self[1] + 1, no_cleanups, false, [ 1 ] ];
		const $bR = held[3];
		let $bS = null;
		if ($bR[0] === 0) {
			const nursery2 = $bR[1];
			$bS = nursery2.cancel();
		} else {
			$bS = undefined;
		}
		$bS;
		let $bZ = null;
		if (held[2]) {
			let failure = [ 1 ];
			for (const cleanup of held[1].v) {
				const $bT = __guarded(cleanup);
				let $bU = null;
				if ($bT[0] === 0) {
					const message = $bT[1];
					if ($bV(failure)) {
						failure = [ 0, message ];
					}
					$bU = undefined;
				} else {
					$bU = undefined;
				}
				$bU;
			}
			const $bX = failure;
			let $bY = null;
			if ($bX[0] === 0) {
				const message2 = $bX[1];
				$bY = (() => {
					throw message2;
				})();
			} else {
				$bY = undefined;
			}
			$bZ = $bY;
		}
		$ca = $bZ;
	}
	return $ca;
}
function get_owner($y) {
	return $y;
}
function release_runs(runs) {
	dispose2([ runs[0], runs[0].v[0] ]);
}
function new_tracker() {
	return [ __shared_new([ 0, false, false, false, false ]), __shared_new([  ]), __shared_new([  ]), __shared_new([  ]), __shared_new([ 1 ]) ];
}
function opened(held) {
	return [ held[0] + 1, true, false, held[3], held[4] ];
}
function closed(held) {
	return [ held[0], false, held[2], held[3], held[4] ];
}
function dirtied(held) {
	return [ held[0], held[1], true, held[3], held[4] || held[3] ];
}
function connecting(held, now) {
	return [ held[0], held[1], held[2], now, held[4] ];
}
function answered(held) {
	return [ held[0], held[1], held[2], held[3], false ];
}
function open_run(tracker) {
	const next = opened(tracker[0].v);
	const epoch = next[0];
	tracker[0].v = next;
	if (!($M(tracker[1].v))) {
		tracker[1].v = [  ];
	}
	return [ __clone(tracker), epoch ];
}
function close_run(tracker) {
	tracker[0].v = closed(tracker[0].v);
	const $cg = tracker[4].v;
	let $ch = null;
	if ($cg[0] === 0) {
		const target2 = $cg[1];
		$ch = reconnect(tracker, target2);
	} else {
		if (!($M(tracker[1].v)) || !($M(tracker[2].v))) {
			tracker[2].v = __clone(tracker[1].v);
		}
		$ch = undefined;
	}
	$ch;
	if (!($M(tracker[1].v))) {
		tracker[1].v = [  ];
	}
}
function reconnect(tracker, target2) {
	if ($M(tracker[1].v) && $M(tracker[3].v)) {
		return;
	}
	const held = __clone(tracker[3].v);
	const reading = __clone(tracker[1].v);
	let kept = [  ];
	for (const _edge of held) {
		kept.push(false);
	}
	let next = [  ];
	tracker[0].v = connecting(tracker[0].v, true);
	let position = 0;
	for (const dependency of reading) {
		const $cn = reusable(held, kept, dependency[0], position);
		let $co = null;
		if ($cn[0] === 0) {
			const index = $cn[1];
			__at_put(kept, index, true);
			next.push(__clone(__at(held, index)));
			$co = undefined;
		} else {
			next.push([ dependency[0], dependency[1](relay_for(tracker, target2)) ]);
			$co = undefined;
		}
		$co;
		position = position + 1;
	}
	tracker[3].v = next;
	let index2 = 0;
	for (const edge of held) {
		if (!(__at(kept, index2))) {
			detach(edge[1]);
		}
		index2 = index2 + 1;
	}
	tracker[0].v = connecting(tracker[0].v, false);
}
function reusable(held, kept, identity, position) {
	const $cj = identity;
	let $ck = null;
	if ($cj[0] === 0) {
		const wanted = $cj[1];
		if (position < held.length && !(__at(kept, position)) && same_identity(__at(held, position)[0], wanted)) {
			return [ 0, position ];
		}
		let index = 0;
		while (index < held.length) {
			if (!(__at(kept, index)) && same_identity(__at(held, index)[0], wanted)) {
				return [ 0, index ];
			}
			index = index + 1;
		}
		$ck = [ 1 ];
	} else {
		$ck = [ 1 ];
	}
	return $ck;
}
function same_identity(identity, wanted) {
	const $cl = identity;
	let $cm = null;
	if ($cl[0] === 0) {
		const held = $cl[1];
		$cm = held === wanted;
	} else {
		$cm = false;
	}
	return $cm;
}
function relay_for(tracker, target2) {
	return subscriber_of(() => {
		const held = tracker[0].v;
		tracker[0].v = dirtied(held);
		if (!(held[3])) {
			wake(target2);
		}
		return;
	}, true);
}
function attach_tracker(tracker, target2) {
	tracker[4].v = [ 0, __clone(target2) ];
	let $cB = null;
	if (!($M(tracker[2].v))) {
		const read = tracker[2].v;
		tracker[2].v = [  ];
		tracker[0].v = connecting(tracker[0].v, true);
		let edges = [  ];
		for (const dependency of read) {
			edges.push([ dependency[0], dependency[1](relay_for(tracker, target2)) ]);
		}
		tracker[3].v = edges;
		tracker[0].v = connecting(tracker[0].v, false);
		if (tracker[0].v[4]) {
			tracker[0].v = answered(tracker[0].v);
			wake(target2);
		}
		$cB = undefined;
	}
	return $cB;
}
function forget_reads(tracker) {
	let $cC = null;
	if (!($M(tracker[3].v))) {
		const edges = tracker[3].v;
		tracker[3].v = [  ];
		for (const edge of edges) {
			detach(edge[1]);
		}
		$cC = undefined;
	}
	$cC;
	if (!($M(tracker[2].v))) {
		tracker[2].v = [  ];
	}
}
function detach_tracker(tracker) {
	tracker[4].v = [ 1 ];
	forget_reads(tracker);
}
function also_releasing(handle, release) {
	const previous = handle[3].v;
	handle[3].v = [ 0, () => {
		release();
		const $cD = previous;
		let $cE = null;
		if ($cD[0] === 0) {
			const earlier = $cD[1];
			$cE = earlier();
		} else {
			$cE = undefined;
		}
		return $cE;
	} ];
}
function ambient_signal($aI) {
	const $aJ = $aI;
	let $aK = null;
	if ($aJ[0] === 0) {
		const n = $aJ[1];
		$aK = [ 0, n.signal_of() ];
	} else {
		$aK = [ 1 ];
	}
	return $aK;
}
function detached_nursery() {
	return __nursery_new_detached();
}
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $aH) {
	return await (self[0].wait(ambient_signal($aH)));
}
function cancel(self) {
	self[0].cancel();
}
function view(tag) {
	let $i = null;
	if (is_svg_tag(tag)) {
		$i = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$i = [ document.createElement(tag) ];
	}
	return $i;
}
function is_svg_tag(tag) {
	const $g = tag;
	let $h = null;
	if ($g === "svg") {
		$h = true;
	} else if ($g === "path") {
		$h = true;
	} else if ($g === "circle") {
		$h = true;
	} else if ($g === "ellipse") {
		$h = true;
	} else if ($g === "rect") {
		$h = true;
	} else if ($g === "line") {
		$h = true;
	} else if ($g === "polyline") {
		$h = true;
	} else if ($g === "polygon") {
		$h = true;
	} else if ($g === "g") {
		$h = true;
	} else if ($g === "defs") {
		$h = true;
	} else if ($g === "use") {
		$h = true;
	} else if ($g === "symbol") {
		$h = true;
	} else if ($g === "marker") {
		$h = true;
	} else if ($g === "pattern") {
		$h = true;
	} else if ($g === "mask") {
		$h = true;
	} else if ($g === "clipPath") {
		$h = true;
	} else if ($g === "linearGradient") {
		$h = true;
	} else if ($g === "radialGradient") {
		$h = true;
	} else if ($g === "stop") {
		$h = true;
	} else if ($g === "text") {
		$h = true;
	} else if ($g === "tspan") {
		$h = true;
	} else if ($g === "textPath") {
		$h = true;
	} else if ($g === "filter") {
		$h = true;
	} else if ($g === "foreignObject") {
		$h = true;
	} else if ($g === "feGaussianBlur") {
		$h = true;
	} else if ($g === "feColorMatrix") {
		$h = true;
	} else if ($g === "feOffset") {
		$h = true;
	} else if ($g === "feMerge") {
		$h = true;
	} else if ($g === "feMergeNode") {
		$h = true;
	} else if ($g === "feFlood") {
		$h = true;
	} else if ($g === "feComposite") {
		$h = true;
	} else if ($g === "feBlend") {
		$h = true;
	} else if ($g === "feDropShadow") {
		$h = true;
	} else {
		$h = false;
	}
	return $h;
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
		return $aM([ 1 ], ($aL) => {
			return handler($aL);
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
	const $dv = $aM([ 1 ], ($ds) => {
		return $dt(body);
	});
	const built = $dv[0];
	const root = $dv[1];
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
function slot_of(key) {
	const parts = key.split(":");
	if (parts.length !== 3) {
		(() => {
			throw "this style\'s slot key is not one media:condition:property triple (got \"" + key + "\"" + ") \u{2014} every field that reaches a key is fenced against \':\' where it is written, so a key holding another one means a condition token was minted carrying the key\'s own separator; that is the bug, not this read";
		})();
	}
	return [ __at(parts, 0), __at(parts, 1), __at(parts, 2) ];
}
function family_longhands(property) {
	const $ab = property;
	let $ac = null;
	if ($ab === "padding") {
		$ac = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($ab === "margin") {
		$ac = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($ab === "inset") {
		$ac = ";top;right;bottom;left;";
	} else if ($ab === "flex") {
		$ac = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($ab === "background") {
		$ac = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($ab === "border") {
		$ac = border_longhands();
	} else {
		$ac = "";
	}
	return $ac;
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
	for (const key of $V(rules)) {
		const slot = slot_of(key);
		if (slot[0] === media && slot[1] === condition && longhands.includes(";" + slot[2] + ";")) {
			$ad(out, key);
		}
	}
	return out;
}
function class_list(self) {
	let out = "";
	for (const entry of $j(self[0])) {
		const $k = entry;
		const class2 = $k[0];
		const _declaration = $k[1];
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
	for (const key of $V(b[0])) {
		const $Z = $W(b[0], key);
		let $aa = null;
		if ($Z[0] === 0) {
			const entry = $Z[1];
			const slot = slot_of(key);
			rules = without_covered(rules, slot[0], slot[1], slot[2]);
			$ae(rules, key, entry);
			$aa = undefined;
		} else {
			$aa = undefined;
		}
		$aa;
	}
	return [ rules ];
}
function page(scroll_fade2, copy, $d, $e, $f) {
	return $n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n(styled(view("div"), shell), bloom($d, $e), $d, $e), top_bar(scroll_fade2, $d, $e), $d, $e), masthead($d, $e), $d, $e), divider($d, $e), $d, $e), install_section(copy, $d, $e, $f), $d, $e), divider($d, $e), $d, $e), showcase_reactive($d, $e), $d, $e), divider($d, $e), $d, $e), showcase_fullstack($d, $e), $d, $e), divider($d, $e), $d, $e), showcase_compiler($d, $e), $d, $e), divider($d, $e), $d, $e), editor_band($d, $e), $d, $e), divider($d, $e), $d, $e), feature_grid($d, $e), $d, $e), divider($d, $e), $d, $e), dogfood($d, $e), $d, $e), page_footer($d, $e), $d, $e);
}
function install_row(label, command, copy, $ar, $as, $at) {
	const icon = $a("" + assets + "/icons/copy.svg");
	const pending = __shared_new([ 1 ]);
	return $n($n(view("div"), text(styled(view("p"), install_label), label), $ar, $as), $n($n(styled(view("div"), install_command), text(styled(view("span"), install_command_text), command), $ar, $as), $n(on($af(styled(view("button"), copy_button), "aria-label", "Copy command", $ar, $as), "click", ($au) => {
		copy(command);
		$av(icon, "" + assets + "/icons/check.svg", [ 0, $au ]);
		const $aF = pending.v;
		let $aG = null;
		if ($aF[0] === 0) {
			const timer = $aF[1];
			$aG = cancel(timer);
		} else {
			$aG = undefined;
		}
		$aG;
		const timer2 = after(2400);
		pending.v = [ 0, __clone(timer2) ];
		__task(async () => {
			if (await (wait(timer2, $at))) {
				$av(icon, "" + assets + "/icons/copy.svg", [ 0, $au ]);
			}
			return;
		}, "install_row");
		return;
	}), $aN($af(styled(view("img"), copy_icon), "alt", "", $ar, $as), "src", __clone(icon), $ar, $as), $ar, $as), $ar, $as), $ar, $as);
}
function install_section(copy, $ao, $ap, $aq) {
	return $n($n($n(styled($af(view("section"), "id", "install", $ao, $ap), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "One command, the whole toolchain"), $ao, $ap), $n($n($n(styled(view("p"), lead), pt("The compiler, dev server with hot reload, formatter, test runner, and language server live in one small binary. There is nothing else to install and nothing to configure. Update any time with "), $ao, $ap), leaf("vilan upgrade"), $ao, $ap), pt("."), $ao, $ap), $ao, $ap), $n($n(styled(view("div"), install_split), $n($n($n(styled(view("div"), install_grid), install_row("macOS / Linux", "curl -fsSL https://github.com/vilan-lang/vilan/releases/latest/download/install.sh | sh", copy, $ao, $ap, $aq), $ao, $ap), install_row("Windows (PowerShell)", "irm https://github.com/vilan-lang/vilan/releases/latest/download/install.ps1 | iex", copy, $ao, $ap, $aq), $ao, $ap), install_row("Homebrew", "brew install vilan-lang/vilan/vilan", copy, $ao, $ap, $aq), $ao, $ap), $ao, $ap), $n(styled(view("div"), install_art_cell), toolchain_art($ao, $ap), $ao, $ap), $ao, $ap), $ao, $ap);
}
function showcase(prose, code, $cF, $cG) {
	return $n($n(styled(view("div"), showcase_grid), __clone(prose), $cF, $cG), __clone(code), $cF, $cG);
}
function showcase_flipped(code, prose, $da, $db) {
	return $n($n(styled(view("div"), showcase_grid_flipped), __clone(code), $da, $db), __clone(prose), $da, $db);
}
function counter_demo($bc, $bd) {
	const count = $be(0);
	return $n($n(styled(view("div"), demo_box), on(text(styled(view("button"), demo_button), "+1"), "click", ($bg) => {
		return $bh(count, (n) => {
			return n + 1;
		}, [ 0, $bg ]);
	}), $bc, $bd), $bu(styled(view("p"), demo_label), $bt(__clone(count), (n, $bq, $br, $bs) => {
		return "clicked " + n + " times";
	}), $bc, $bd), $bc, $bd);
}
function showcase_reactive($ba, $bb) {
	return $n($n(styled(view("section"), add(add(column, section_block), stack)), showcase($n($n($n($n(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "UI that follows your data"), $ba, $bb), $n($n($n(styled(view("p"), lead), pt("A view is a value and a binding is a subscription: "), $ba, $bb), leaf("bind_text"), $ba, $bb), pt(" sets the text node once, then sets it again whenever the signal changes. There is no virtual DOM, no render loop, and no dependency array to babysit. Updates land exactly where the data changed."), $ba, $bb), $ba, $bb), text(styled(view("p"), lead), "The snippet is the whole program, and it runs. Try it right here:"), $ba, $bb), counter_demo($ba, $bb), $ba, $bb), code_panel([ ln([ kw("import"), t(" std::ui::{ view, mount_root };") ]), ln([ kw("import"), t(" std::reactive::"), ty("Signal"), t(";") ]), blank(), ln([ kw("fun"), t(" "), fn("main"), t("() {") ]), ln([ t("    "), kw("let"), t(" count = "), ty("Signal"), t("::"), fn("new"), t("("), st("0"), t(");") ]), ln([ t("    "), kw("let"), t(" _root = "), fn("mount_root"), t("("), st("\"app\""), t(", || {") ]), ln([ t("        "), fn("view"), t("("), st("\"div\""), t(")") ]), ln([ t("            ."), fn("child"), t("("), fn("view"), t("("), st("\"p\""), t(")."), fn("bind_text"), t("(count."), fn("derive"), t("(|n: i32| "), st("i\"clicked "), hl("{"), t("n"), hl("}"), st(" times\""), t(")))") ]), ln([ t("            ."), fn("child"), t("("), fn("view"), t("("), st("\"button\""), t(")."), fn("text"), t("("), st("\"+1\""), t(")."), fn("on"), t("("), st("\"click\""), t(", || count."), fn("set_with"), t("(|n| n + "), st("1"), t(")))") ]), ln([ t("    });") ]), ln([ t("}") ]) ]), $ba, $bb), $ba, $bb), dataflow_art($ba, $bb), $ba, $bb);
}
function showcase_fullstack($cP, $cQ) {
	return $n($n($n($n(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "The server is a struct. The client is generated."), $cP, $cQ), $n($n($n($n($n(styled(view("p"), lead), pt("Mark a method "), $cP, $cQ), leaf_link("/docs/guide/services.html#what-rpc-calls-do", "[rpc]", $cP, $cQ), $cP, $cQ), pt(" and the browser can call it like any other function, typed and checked. Mark a signal "), $cP, $cQ), leaf_link("/docs/guide/services.html#mirrors", "[expose]", $cP, $cQ), $cP, $cQ), pt(" and every connected client holds a live mirror that updates when the server writes. You never write REST endpoints, fetch calls, or the JSON shapes that drift out of sync between them."), $cP, $cQ), $cP, $cQ), diagram($cP, $cQ), $cP, $cQ), button_link("/docs/guide/services.html", "Services & RPC in the guide", $cP, $cQ), $cP, $cQ);
}
function showcase_compiler($cY, $cZ) {
	return $n(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped($n($n(styled(view("div"), diag_stack), code_panel([ ln([ kw("import"), t(" std::io::print;") ]), ln([ kw("import"), t(" std::option::"), ty("Option"), t("::{ self, "), ty("Some"), t(", "), ty("None"), t(" };") ]), ln([ kw("fun"), t(" "), fn("find_user"), t("(id: i32): "), ty("Option"), t("<str> {") ]), ln([ t("    "), kw("if"), t(" id == "), st("1"), t(" { "), ty("Some"), t("("), st("\"Ada\""), t(") } "), kw("else"), t(" { "), ty("None"), t(" }") ]), ln([ t("}") ]), ln([ kw("fun"), t(" "), fn("greet"), t("(name: str): str {") ]), ln([ t("    "), st("i\"hello "), hl("{"), t("name"), hl("}"), st("\"") ]), ln([ t("}") ]), ln([ kw("fun"), t(" "), fn("main"), t("() {") ]), ln([ t("    "), fn("print"), t("("), fn("greet"), t("("), fn("find_user"), t("("), st("2"), t(")));") ]), ln([ t("}") ]) ]), $cY, $cZ), $n($n($n($n($n($n($n(styled(view("pre"), diag_pre), ln([ text(styled(view("span"), diag_error), "Error:"), t(" Expected str, but got Option<str> instead.") ]), $cY, $cZ), ln([ text(styled(view("span"), diag_frame), "    \u{256d}\u{2500}[ demo.vl:10:14 ]") ]), $cY, $cZ), ln([ text(styled(view("span"), diag_frame), "    \u{2502}") ]), $cY, $cZ), ln([ text(styled(view("span"), diag_frame), " 10 \u{2502}     print(greet(find_user(2)));") ]), $cY, $cZ), ln([ text(styled(view("span"), diag_frame), "    \u{2502}                 \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{252c}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}") ]), $cY, $cZ), ln([ text(styled(view("span"), diag_frame), "    \u{2502}                       \u{2570}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500} Expected str, but got Option<str> instead.") ]), $cY, $cZ), ln([ text(styled(view("span"), diag_frame), "\u{2500}\u{2500}\u{2500}\u{2500}\u{256f}") ]), $cY, $cZ), $cY, $cZ), $n($n($n($n(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "Find out at compile time"), $cY, $cZ), $n($n($n($n($n(styled(view("p"), lead), pt("Vilan has no null and no exceptions. A value that might be missing is an "), $cY, $cZ), leaf_link("/docs/std/option-result.html#optiont", "Option", $cY, $cZ), $cY, $cZ), pt(", a call that might fail returns a "), $cY, $cZ), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $cY, $cZ), $cY, $cZ), pt(", and the compiler makes you look inside before you use either. The mistake in this snippet is a build error, not a production incident."), $cY, $cZ), $cY, $cZ), text(styled(view("p"), lead), "Values are copied rather than silently shared, so two names never fight over one object. Most of the mistakes JavaScript saves for runtime cannot even be written."), $cY, $cZ), button_link("/docs/std/option-result.html", "Option & Result in the reference", $cY, $cZ), $cY, $cZ), $cY, $cZ), $cY, $cZ);
}
function editor_band($dc, $dd) {
	return $n(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped(editor_art($dc, $dd), $n($n($n($n(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "The editor is in on it"), $dc, $dd), $n($n($n($n(styled(view("p"), lead), leaf("vilan"), $dc, $dd), pt(" and "), $dc, $dd), leaf("vilan-lsp"), $dc, $dd), pt(" ship together so your editor and build never disagree. In-editor diagnostics, hover types and docs, autocompletion, Symbol Rename, formatting, and Organize Imports are all available in VS Code today."), $dc, $dd), $dc, $dd), text(styled(view("p"), lead), "One broken line does not take the tooling down. The rest of the file keeps compiling, serving hovers, and completing while you fix it."), $dc, $dd), button_link("https://github.com/vilan-lang/vilan/tree/main/editors/vscode", "The VS Code extension", $dc, $dd), $dc, $dd), $dc, $dd), $dc, $dd);
}
function button_link(href, label, $cW, $cX) {
	return $n($n($af(styled(view("a"), button_link_style), "href", href, $cW, $cX), pt(label), $cW, $cX), $af($af(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $cW, $cX), "alt", "", $cW, $cX), $cW, $cX);
}
function docs_link(href, label, $dk, $dl) {
	return $n($n($af(styled(view("a"), card_link), "href", href, $dk, $dl), pt(label), $dk, $dl), $af($af(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $dk, $dl), "alt", "", $dk, $dl), $dk, $dl);
}
function feature(icon, name, href, body, $di, $dj) {
	return $n($n($n($n(styled(view("article"), card), $af($af(styled(view("img"), card_icon), "src", "" + assets + "/icons/" + icon + ".svg", $di, $dj), "alt", "", $di, $dj), $di, $dj), text(styled(view("h3"), card_title), name), $di, $dj), children(styled(view("p"), card_body), body), $di, $dj), docs_link(href, "docs", $di, $dj), $di, $dj);
}
function feature_grid($dg, $dh) {
	return $n($n(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "Built into the language"), $dg, $dh), $n($n($n($n($n($n($af(styled(view("div"), cards_grid), "data-glow", "", $dg, $dh), feature("shield-check", "No null, no exceptions", "/docs/std/option-result.html", [ pt("A missing value is an "), leaf_link("/docs/std/option-result.html#optiont", "Option", $dg, $dh), pt(", a failure is a "), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $dg, $dh), pt(", and "), leaf("match"), pt(" makes you handle both arms. Errors are ordinary values you pass around like any other data.") ], $dg, $dh), $dg, $dh), feature("copy", "Values, not references", "/docs/tour/memory-model.html", [ pt("Assignment copies. Sharing is explicit, borrowing is checked, and spooky action at a distance is a compile error.") ], $dg, $dh), $dg, $dh), feature("zap", "Async without the ceremony", "/docs/tour/async.html", [ leaf_link("/docs/tour/async.html#opting-out-of-waiting-async-and-await", "await", $dg, $dh), pt(" is implicit. Call an async function and the machinery is the compiler\'s problem. When you want real concurrency, tasks and "), leaf_link("/docs/tour/async.html#nurseries-structured-spawning", "nurseries", $dg, $dh), pt(" give it structure.") ], $dg, $dh), $dg, $dh), feature("layers", "One program, two platforms", "/docs/tour/platforms.html", [ pt("One workspace compiles the node server and the browser client. The compiler tracks which code needs which platform and keeps each bundle honest.") ], $dg, $dh), $dg, $dh), feature("server", "Rendered before it ships", "/docs/guide/ssr.html", [ leaf("std::ui"), pt(" renders on the server too: first paint is real markup, then the client rebuilds it live. View source on this page and the content is already there.") ], $dg, $dh), $dg, $dh), feature("refresh-cw", "A dev loop that keeps up", "/docs/guide/dev-loop.html", [ leaf("vilan run . --watch"), pt(" rebuilds in milliseconds and hot-reloads the browser. Format, test, and language server ship in the same binary.") ], $dg, $dh), $dg, $dh), $dg, $dh);
}
function dogfood($dm, $dn) {
	return $n($n($n(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("p"), dogfood_text), "This site is a vilan program: one package, three entries \u{2014} this page, the playground, and the server that renders both. The server rendered the markup you first saw, and the browser rebuilt it live."), $dm, $dn), text(styled(view("p"), dogfood_text), "Vilan is built to last. Semantics are settled on paper before they are implemented, and pinned by tests after. A language is a foundation, and a foundation should not move under you."), $dm, $dn), $n(styled(view("p"), dogfood_cta), docs_link("https://github.com/vilan-lang/website", "Read this page\'s source", $dm, $dn), $dm, $dn), $dm, $dn);
}
function footer_column(title, links, $dq, $dr) {
	return $n($n(view("div"), text(styled(view("p"), footer_head), title), $dq, $dr), children(styled(view("div"), footer_list), links), $dq, $dr);
}
function page_footer($do, $dp) {
	return $n($n(styled(view("footer"), footer_block), $n($n($n($n(styled(view("div"), add(column, footer_grid)), styled($af($af($af(view("img"), "src", "" + assets + "/footer_mark.webp", $do, $dp), "alt", "The vilan mark", $do, $dp), "width", "200", $do, $dp), footer_mark), $do, $dp), footer_column("Using Vilan", [ text($af(styled(view("a"), footer_link), "href", "#install", $do, $dp), "Install"), text($af(styled(view("a"), footer_link), "href", "/docs/tour/hello-vilan.html", $do, $dp), "Learn"), text($af(styled(view("a"), footer_link), "href", "/playground", $do, $dp), "Playground"), text($af(styled(view("a"), footer_link), "href", "/docs/", $do, $dp), "Documentation") ], $do, $dp), $do, $dp), footer_column("Community", [ text($af(styled(view("a"), footer_link), "href", "" + repo + "/issues", $do, $dp), "Issues"), text($af(styled(view("a"), footer_link), "href", "" + repo + "/discussions", $do, $dp), "Discussions"), text($af(styled(view("a"), footer_link), "href", "https://github.com/vilan-lang", $do, $dp), "GitHub") ], $do, $dp), $do, $dp), footer_column("Terms & policies", [ text($af(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/CODE_OF_CONDUCT.md", $do, $dp), "Code of Conduct"), text($af(styled(view("a"), footer_link), "href", "" + repo + "#license", $do, $dp), "Licenses"), text($af(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/assets/branding/LICENSE", $do, $dp), "Logo Policy") ], $do, $dp), $do, $dp), $do, $dp), $n(styled(view("div"), column), $n($n(styled(view("div"), footer_micro), text(view("span"), "\u{a9} 2026 Reed Syllas"), $do, $dp), text(view("span"), "MIT or Apache-2.0"), $do, $dp), $do, $dp), $do, $dp);
}
function diagram($cT, $cU) {
	return $n($n($n($n($n($n($n($n(styled(view("div"), art_stage), styled(view("div"), dg_blob_top), $cT, $cU), styled(view("div"), dg_blob_left), $cT, $cU), styled(view("div"), dg_blob_right), $cT, $cU), grain(), $cT, $cU), $n($n(styled(view("div"), dg_source), $cV(styled(view("p"), art_tab), "notes.vl \u{b7} one source", $cT, $cU), $cT, $cU), $n($n($n($n($n($n($n($n($n(styled(view("div"), art_code), ln([ t("["), kw("service"), t("(NotesClient)]") ]), $cT, $cU), ln([ kw("struct"), t(" Notes {") ]), $cT, $cU), ln([ t("    ["), kw("expose"), t("] entries: SignalCell<List<Note>>,") ]), $cT, $cU), ln([ t("}") ]), $cT, $cU), blank(), $cT, $cU), ln([ kw("impl"), t(" Notes {") ]), $cT, $cU), ln([ t("    ["), kw("rpc"), t("]") ]), $cT, $cU), ln([ t("    "), kw("fun"), t(" add(self, text: str): i32 { \u{2026} }") ]), $cT, $cU), ln([ t("}") ]), $cT, $cU), $cT, $cU), $cT, $cU), $n($n($n($n(styled(view("div"), dg_wire_zone), styled(view("div"), dg_wire_left), $cT, $cU), styled(view("div"), dg_wire_right), $cT, $cU), $cV(styled(view("span"), dg_wire_label_left), "vilan build", $cT, $cU), $cT, $cU), $cV(styled(view("span"), dg_wire_label_right), "vilan build", $cT, $cU), $cT, $cU), $cT, $cU), $n($n($n(styled(view("div"), dg_legs), $n($n(styled(view("div"), art_card), $n($n($n(styled(view("div"), dg_leg_head), styled(view("div"), dot_magenta), $cT, $cU), $cV(styled(view("span"), dg_leg_name), "the server", $cT, $cU), $cT, $cU), $cV(styled(view("span"), dg_leg_env), "node", $cT, $cU), $cT, $cU), $cT, $cU), $n($n(styled(view("div"), art_code), ln([ t("serve_service(4000,") ]), $cT, $cU), ln([ t("    notes.dispatcher() \u{2026})") ]), $cT, $cU), $cT, $cU), $cT, $cU), $n($n(styled(view("div"), dg_mid), $n($n(view("div"), $cV(styled(view("p"), dg_mid_label), "notes.add(\"ship it\")", $cT, $cU), $cT, $cU), $n($n(styled(view("div"), dg_line_row), styled(view("div"), arrow_head_left), $cT, $cU), styled(view("div"), dg_line), $cT, $cU), $cT, $cU), $cT, $cU), $n($n($n(view("div"), $n($n(styled(view("div"), dg_line_row), styled(view("div"), dg_line_dashed), $cT, $cU), styled(view("div"), arrow_head_right_rose), $cT, $cU), $cT, $cU), $cV(styled(view("p"), dg_mid_label_rose), "entries", $cT, $cU), $cT, $cU), $cV(styled(view("p"), dg_note), "mirrored live", $cT, $cU), $cT, $cU), $cT, $cU), $cT, $cU), $n($n(styled(view("div"), art_card), $n($n($n(styled(view("div"), dg_leg_head), styled(view("div"), dot_orange), $cT, $cU), $cV(styled(view("span"), dg_leg_name), "the client", $cT, $cU), $cT, $cU), $cV(styled(view("span"), dg_leg_env), "browser", $cT, $cU), $cT, $cU), $cT, $cU), $n($n(styled(view("div"), art_code), ln([ kw("let"), t(" notes = NotesClient::connect("), st("\"/rpc\""), t(");") ]), $cT, $cU), ln([ t("notes.entries "), t("// Signal, live") ]), $cT, $cU), $cT, $cU), $cT, $cU), $cT, $cU), $cV(styled(view("p"), art_caption), "one definition: the compiler builds both sides and keeps them honest", $cT, $cU), $cT, $cU);
}
function editor_art($de, $df) {
	return $n($n($n($n(styled(view("div"), art_stage), styled(view("div"), ed_blob_a), $de, $df), styled(view("div"), ed_blob_b), $de, $df), grain(), $de, $df), $n($n($n($n(styled(view("div"), ed_window), $n($n($n($n(styled(view("div"), ed_titlebar), styled(view("div"), ed_dot_red), $de, $df), styled(view("div"), ed_dot_orange), $de, $df), styled(view("div"), ed_dot_magenta), $de, $df), text(styled(view("span"), ed_title), "app.vl \u{2014} vilan"), $de, $df), $de, $df), $n($n(styled(view("div"), ed_body), text(styled(view("div"), ed_gutter), "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"), $de, $df), $n($n($n($n($n($n($n($n($n($n($n(styled(view("div"), ed_code), ln([ kw("import"), t(" std::io::print;") ]), $de, $df), ln([ kw("import"), t(" std::option::Option::{ self, Some, None };") ]), $de, $df), ln([ kw("fun"), t(" find_user(id: i32): Option<str> {") ]), $de, $df), ln([ t("    "), kw("if"), t(" id == 1 { Some("), st("\"Ada\""), t(") } "), kw("else"), t(" { None }") ]), $de, $df), ln([ t("}") ]), $de, $df), ln([ kw("fun"), t(" greet(name: str): str {") ]), $de, $df), ln([ t("    "), st("i\"hello {name}\"") ]), $de, $df), ln([ t("}") ]), $de, $df), ln([ kw("fun"), t(" main() {") ]), $de, $df), ln([ t("    print(greet("), text(styled(view("span"), ed_squiggle), "find_user(2)"), t("));"), styled(view("span"), ed_caret) ]), $de, $df), ln([ t("}") ]), $de, $df), $de, $df), $de, $df), $n($n($n(styled(view("div"), ed_statusbar), text(styled(view("span"), ed_problem), "\u{2297} 1"), $de, $df), text(view("span"), "vilan-lsp"), $de, $df), text(styled(view("span"), ed_status_right), "Ln 10, Col 17 \u{b7} app.vl"), $de, $df), $de, $df), $n($n(styled(view("div"), ed_hover), text(styled(view("div"), ed_hover_error), "Expected str, but got Option<str> instead."), $de, $df), text(styled(view("div"), ed_hover_from), "vilan \u{b7} live as you type"), $de, $df), $de, $df), $de, $df);
}
function tc_chip_at(left, top, color, label, $aY, $aZ) {
	return $n($n($af(styled(view("div"), tc_chip), "style", "left: " + left + "; top: " + top, $aY, $aZ), $af(styled(view("div"), led), "style", "background: " + color, $aY, $aZ), $aY, $aZ), text(view("span"), label), $aY, $aZ);
}
function toolchain_art($aW, $aX) {
	return $n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n(styled(view("div"), tc_wrap), styled(view("div"), tc_blob_b), $aW, $aX), styled(view("div"), tc_blob_a), $aW, $aX), styled(view("div"), tc_blob_c), $aW, $aX), grain(), $aW, $aX), styled(view("div"), tc_spoke_up), $aW, $aX), styled(view("div"), tc_spoke_down), $aW, $aX), styled(view("div"), tc_spoke_run), $aW, $aX), styled(view("div"), tc_spoke_fmt), $aW, $aX), styled(view("div"), tc_spoke_lsp), $aW, $aX), styled(view("div"), tc_spoke_upgrade), $aW, $aX), styled(view("div"), tc_center_mask), $aW, $aX), $af($af(styled(view("div"), tc_center), "role", "img", $aW, $aX), "aria-label", "vilan", $aW, $aX), $aW, $aX), tc_chip_at("210px", "70px", primary[0], "vilan build", $aW, $aX), $aW, $aX), tc_chip_at("328px", "142px", "#D84730", "vilan run --watch", $aW, $aX), $aW, $aX), tc_chip_at("344px", "288px", accent[0], "vilan fmt", $aW, $aX), $aW, $aX), tc_chip_at("210px", "360px", "#B23056", "vilan test", $aW, $aX), $aW, $aX), tc_chip_at("78px", "288px", "#8B2786", "vilan-lsp", $aW, $aX), $aW, $aX), tc_chip_at("82px", "142px", "#672283", "vilan upgrade", $aW, $aX), $aW, $aX);
}
function df_arrow_to(label, $cN, $cO) {
	return $n($n(styled(view("div"), df_arrow), text(styled(view("span"), df_arrow_label), label), $cN, $cO), $n($n(styled(view("div"), df_arrow_row), styled(view("div"), dg_line), $cN, $cO), styled(view("div"), arrow_head_right), $cN, $cO), $cN, $cO);
}
function df_node_view(lit, tag, body, $cJ, $cK) {
	const $cM = view("div");
	let $cL = null;
	if (lit) {
		$cL = df_node_lit;
	} else {
		$cL = df_node;
	}
	return $n($n(styled($cM, $cL), text(styled(view("p"), df_tag), tag), $cJ, $cK), $n(styled(view("div"), art_code), ln(body), $cJ, $cK), $cJ, $cK);
}
function dataflow_art($cH, $cI) {
	return $n($n($n($n($n(styled(view("div"), df_wrap), styled(view("div"), df_blob_a), $cH, $cI), styled(view("div"), df_blob_b), $cH, $cI), grain(), $cH, $cI), $n($n($n($n($n(styled(view("div"), df_row), df_node_view(false, "the write", [ t("count.set("), st("2"), t(")") ], $cH, $cI), $cH, $cI), df_arrow_to("notify", $cH, $cI), $cH, $cI), df_node_view(false, "the signal", [ t("SignalCell<i32> "), kw("= 2") ], $cH, $cI), $cH, $cI), df_arrow_to("re-set", $cH, $cI), $cH, $cI), df_node_view(true, "the one text node", [ t("<p>clicked "), kw("2"), t(" times</p>") ], $cH, $cI), $cH, $cI), $cH, $cI), text(styled(view("p"), art_caption), "no virtual DOM, no re-render: the subscription updates exactly one node"), $cH, $cI);
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
function leaf_link(href, text2, $cR, $cS) {
	return text($af(styled(view("a"), leaf_link_style), "href", href, $cR, $cS), text2);
}
function pt(text2) {
	return text(view("span"), text2);
}
function bloom($l, $m) {
	return $n(styled(view("div"), bloom_field), $n($n(styled(view("div"), bloom_drift), $n(styled(view("div"), bloom_blurwrap), styled(view("div"), bloom_gradient), $l, $m), $l, $m), styled(view("div"), bloom_duo), $l, $m), $l, $m);
}
function hero($ak, $al) {
	return $n($n($n($n(styled(view("header"), hero_block), text(styled(view("h1"), visually_hidden), "Vilan \u{2014} The Modern Web Language"), $ak, $al), $af($af(styled(view("img"), hero_mark), "src", "" + assets + "/dark_logo_flat.svg", $ak, $al), "alt", "", $ak, $al), $ak, $al), $af($af(styled(view("img"), hero_wordmark), "src", "" + assets + "/wordmark_hero.svg", $ak, $al), "alt", "VILAN", $ak, $al), $ak, $al), text($af(styled(view("p"), hero_tagline), "aria-hidden", "true", $ak, $al), "The Modern Web Language"), $ak, $al);
}
function masthead($ai, $aj) {
	return $n(styled(view("div"), masthead_wrap), hero($ai, $aj), $ai, $aj);
}
function divider($am, $an) {
	return $n(styled(view("div"), column), styled(view("div"), rule_line), $am, $an);
}
function grain() {
	return styled(view("div"), grain_overlay);
}
function top_bar(scroll_fade2, $q, $r) {
	return $n($s(styled(view("nav"), topbar), "--nav-fade", __clone(scroll_fade2), $q, $r), $n($n(styled(view("div"), add(column, nav_row)), $n($n($af(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $q, $r), $af(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $q, $r), $q, $r), text(view("span"), "VILAN"), $q, $r), $q, $r), $n($n($n($n(styled(view("div"), nav_links), text($af(styled(view("a"), nav_link), "href", "/#install", $q, $r), "Install"), $q, $r), text($af(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html", $q, $r), "Learn"), $q, $r), text($af(styled(view("a"), nav_link), "href", "/playground/", $q, $r), "Playground"), $q, $r), text($af(styled(view("a"), nav_link), "href", "/docs/", $q, $r), "Docs"), $q, $r), $q, $r), $q, $r);
}
function $b(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function $a(value) {
	return $b(value);
}
function $j(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry.slice(1, 3)));
	}
	return result;
}
function $n(self, content, $o, $p) {
	place(__clone(content), self, $o, $p);
	return __clone(self);
}
function $E(signal, subscriber) {
	const handle = [ signal[1], subscriber[0], subscriber[2], __shared_new([ 1 ]) ];
	signal[1].v.push(reissued(subscriber));
	return handle;
}
function $B(signal, observer) {
	const cell = signal[0];
	return $E(signal, mint_subscriber(() => {
		const $C = [ 0, cell ];
		let $D = null;
		if ($C[0] === 0) {
			const live = $C[1];
			$D = observer(live.v);
		} else {
			$D = undefined;
		}
		return $D;
	}));
}
function $F(self) {
	return __clone(self[0].v);
}
function $A(self, observer, immediately) {
	const subscription = $B(self, observer);
	if (immediately) {
		observer($F(self));
	}
	return subscription;
}
function $z(self, observer) {
	return $A(self, observer, true);
}
function $M(self) {
	return self.length === 0;
}
function $L(self) {
	let $N = null;
	if ($M(self)) {
		$N = [ 1 ];
	} else {
		$N = __list_get(self, self.length - 1);
	}
	return $N;
}
function $G(self, item, $H) {
	defer(self, () => {
		dispose(item, $H);
		return;
	});
	return __clone(item);
}
function $v(flow, observer, $w, $x) {
	$G(get_owner($x), $z(__clone(flow), observer), $w);
}
function $s(self, name, source, $t, $u) {
	const element = __clone(self[0]);
	$v(__clone(source), (value) => {
		element.style.setProperty(name, value);
		return;
	}, $t, $u);
	return __clone(self);
}
function $V(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[0]));
	}
	return result;
}
function $W(self, key) {
	const $X = __map_get(self[0], hash(key));
	let $Y = null;
	if ($X[0] === 0) {
		const entry = $X[1];
		$Y = [ 0, __clone(entry.slice(1, 3)) ];
	} else {
		$Y = [ 1 ];
	}
	return $Y;
}
function $ad(self, key) {
	self[0].delete(hash(key));
}
function $ae(self, key, value) {
	self[0].set(hash(key), [ __clone(key), ...__clone(value) ]);
}
function $af(self, name, value, $ag, $ah) {
	apply(__clone(value), self, name, $ag, $ah);
	return __clone(self);
}
function $ax(self, $ay) {
	const $az = $ay;
	let $aA = null;
	if ($az[0] === 0) {
		const turn = $az[1];
		$aA = enqueue(turn, __clone(self[1].v));
	} else {
		const $aD = $L(draining_turns.v);
		let $aE = null;
		if ($aD[0] === 0) {
			const draining = $aD[1];
			$aE = enqueue(draining, __clone(self[1].v));
		} else {
			for (const subscriber of __clone(self[1].v)) {
				if (subscriber[2].v) {
					subscriber[1]();
				}
			}
			$aE = undefined;
		}
		$aA = $aE;
	}
	return $aA;
}
function $av(self, value, $aw) {
	self[0].v = __clone(value);
	$ax(self, $aw);
}
function $aM(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[5].v = true;
	return result;
}
function $aT(flow, parent, name, $aU, $aV) {
	const element = __clone(parent[0]);
	$v(__clone(flow), (value) => {
		element.setAttribute(name, value);
		return;
	}, $aU, $aV);
}
function $aQ(self, parent, name, $aR, $aS) {
	$aT(__clone(self), parent, name, $aR, $aS);
}
function $aN(self, name, source, $aO, $aP) {
	$aQ(__clone(source), self, name, $aO, $aP);
	return __clone(self);
}
function $be(value) {
	return $b(value);
}
function $bk(self, value, $aw) {
	self[0].v = __clone(value);
	$ax(self, $aw);
}
function $bh(self, transform, $bi) {
	$bk(self, transform($F(self)), $bi);
}
function $bt(self, transform) {
	return [ __clone(self), transform ];
}
function $bC(self, subscriber) {
	return $E(self, subscriber);
}
function $bB(self) {
	return [ () => {
		return $F(self);
	}, (subscriber) => {
		return $bC(self, subscriber);
	}, () => {
		return;
	} ];
}
function $bV(self) {
	const $bW = self;
	return $bW[0] === 1;
}
function $bQ(runs, body) {
	const run = renew(runs, true);
	const $cc = nursery(run);
	let $cd = null;
	if ($cc[0] === 0) {
		const nursery2 = $cc[1];
		$cd = (($ce) => {
			return (($cf) => {
				return body($ce, $cf);
			})(nursery2);
		})(run);
	} else {
		$cd = (() => {
			throw "a renewed run carries its nursery";
		})();
	}
	return $cd;
}
function $ct(self) {
	let $cv = null;
	if ($M(self)) {
		$cv = [ 1 ];
	} else {
		$cv = __list_get(self, self.length - 1);
	}
	return $cv;
}
function $bL(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = $bQ(runs, ($bN, $bO) => {
		return (($bP) => {
			return body($bN, $bP, $bO);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function $bH(runs, tracker, body) {
	let value = $bL(runs, tracker, ($bI, $bJ, $bK) => {
		return body($bI, $bJ, $bK);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v = answered(tracker[0].v);
		value = $bL(runs, tracker, ($cy, $cz, $cA) => {
			return body($cy, $cz, $cA);
		});
		rounds = rounds + 1;
	}
	if (tracker[0].v[4]) {
		tracker[0].v = answered(tracker[0].v);
	}
	return value;
}
function $bA(self) {
	const transform = self[1];
	const upstream = $bB(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return $bH(runs, tracker, ($bE, $bF, $bG) => {
			return transform(value, $bE, $bF, $bG);
		});
	}, (subscriber) => {
		const handle = upstream_attach(subscriber);
		attach_tracker(tracker, subscriber);
		return handle;
	}, () => {
		detach_tracker(tracker);
		release_runs(runs);
		upstream[2]();
		return;
	} ];
}
function $bz(flow, observer, immediately) {
	const instance = $bA(flow);
	const pull = instance[0];
	if (!(immediately)) {
		pull();
	}
	const subscription = instance[1](mint_subscriber(() => {
		return observer(pull());
	}));
	also_releasing(subscription, instance[2]);
	if (immediately) {
		observer(pull());
	}
	return subscription;
}
function $by(self, observer) {
	return $bz(self, observer, true);
}
function $bx(flow, observer, $w, $x) {
	$G(get_owner($x), $by(flow, observer), $w);
}
function $bu(self, source, $bv, $bw) {
	const element = __clone(self[0]);
	$bx(source, (value) => {
		element.textContent = value;
		return;
	}, $bv, $bw);
	return __clone(self);
}
function $cV(self, content, $o, $p) {
	place2(__clone(content), self, $o, $p);
	return __clone(self);
}
function $dt(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, scope ];
}
const minting_derivation = __shared_new(false);
const next_subscriber_id = __shared_new(0);
const draining_turns = __shared_new([  ]);
const releasing_turns = __shared_new([  ]);
const no_cleanups = __shared_new([  ]);
const owner_lists_allocated_count = __shared_new(0);
const install_label = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk1zs", "font-size:12px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::letter-spacing", [ "::letter-spacing", "s1odj0cm", "letter-spacing:0.12em" ] ], [ "::color", [ "::color", "s1i5dkrp", "color:var(--primary)" ] ], [ "::text-transform", [ "::text-transform", "s1s2tj83", "text-transform:uppercase" ] ], [ "::margin-top", [ "::margin-top", "snx6qqx", "margin-top:var(--space-1)" ] ], [ "::margin-bottom", [ "::margin-bottom", "s1c0tkfh", "margin-bottom:var(--space-1)" ] ] ]) ] ];
const install_command = [ [ new Map([ [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::background-color", [ "::background-color", "s1ydv2q1", "background-color:var(--down-normal)" ] ], [ "::border-radius", [ "::border-radius", "s94jixf", "border-radius:6px" ] ], [ "::border", [ "::border", "s84iv6f", "border:1px solid var(--stroke-hard)" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-feature-settings", [ "::font-feature-settings", "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ]) ] ];
const install_command_text = [ [ new Map([ [ "::display", [ "::display", "sowfjmu", "display:block" ] ], [ "::overflow", [ "::overflow", "s19aluk0", "overflow:auto" ] ], [ "::scrollbar-width", [ "::scrollbar-width", "shop8ox", "scrollbar-width:none" ] ], [ "::padding-top", [ "::padding-top", "stbzxp9", "padding-top:var(--space-3)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiykh", "padding-bottom:var(--space-3)" ] ], [ "::padding-left", [ "::padding-left", "s1vtes9o", "padding-left:16px" ] ], [ "::padding-right", [ "::padding-right", "s16t5edj", "padding-right:48px" ] ], [ "::white-space", [ "::white-space", "s1oc7mru", "white-space:pre" ] ], [ "::user-select", [ "::user-select", "svsrq00", "user-select:all" ] ] ]) ] ];
const copy_button = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::top", [ "::top", "s9a503", "top:6px" ] ], [ "::right", [ "::right", "svx3tuz", "right:8px" ] ], [ "::justify-content", [ "::justify-content", "s1d7ek7w", "justify-content:center" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::width", [ "::width", "s178gloh", "width:28px" ] ], [ "::height", [ "::height", "s22y11v", "height:28px" ] ], [ "::background-color", [ "::background-color", "ssxqr8g", "background-color:var(--down-bright)" ] ], [ "::border-radius", [ "::border-radius", "s94jklx", "border-radius:8px" ] ], [ "::border", [ "::border", "s84iv6f", "border:1px solid var(--stroke-hard)" ] ], [ "::transition", [ "::transition", "spw2fur", "transition:border-color 80ms ease, transform 80ms ease" ] ], [ "::cursor", [ "::cursor", "s1onu0uk", "cursor:pointer" ] ], [ ":hover:border-color", [ ":hover:border-color", "s164fd6n", "border-color:var(--primary)" ] ], [ ":active:transform", [ ":active:transform", "s4vadk5", "transform:scale(0.92)" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ] ]) ] ];
const copy_icon = [ [ new Map([ [ "::width", [ "::width", "s178frfh", "width:15px" ] ], [ "::height", [ "::height", "s22x6sv", "height:15px" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", "svfmjlf", "-webkit-user-drag:none" ] ] ]) ] ];
const install_grid = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::gap", [ "::gap", "s8myyrk", "gap:var(--space-4)" ] ], [ "::min-width", [ "::min-width", "sitgfdt", "min-width:0" ] ] ]) ] ];
const install_split = [ [ new Map([ [ "::display", [ "::display", "sbipssh", "display:grid" ] ], [ "::gap", [ "::gap", "s8myyv8", "gap:var(--space-8)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", "s1o6spkj", "grid-template-columns:6fr 5fr" ] ], [ "::--reveal", [ "::--reveal", "s1wraoya", "--reveal:1" ] ] ]) ] ];
const install_art_cell = [ [ new Map([ [ "::display", [ "::display", "sbiv4i3", "display:none" ] ], [ "1024px::display", [ "1024px::display", "s1pon8d1", "display:block" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ] ]) ] ];
const showcase_grid = [ [ new Map([ [ "::display", [ "::display", "sbipssh", "display:grid" ] ], [ "::gap", [ "::gap", "s8myyv8", "gap:var(--space-8)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", "s12tw3cj", "grid-template-columns:5fr 6fr" ] ], [ "::--reveal", [ "::--reveal", "s1wraoya", "--reveal:1" ] ] ]) ] ];
const showcase_grid_flipped = [ [ new Map([ [ "::display", [ "::display", "sbipssh", "display:grid" ] ], [ "::gap", [ "::gap", "s8myyv8", "gap:var(--space-8)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", "s1o6spkj", "grid-template-columns:6fr 5fr" ] ], [ "::--reveal", [ "::--reveal", "s1wraoya", "--reveal:1" ] ] ]) ] ];
const showcase_copy = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::gap", [ "::gap", "s8myyqn", "gap:var(--space-3)" ] ] ]) ] ];
const demo_box = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::gap", [ "::gap", "s8myyrk", "gap:var(--space-4)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::padding", [ "::padding", "s1ufvr2", "padding:var(--space-4)" ] ], [ "::margin-top", [ "::margin-top", "snx6qto", "margin-top:var(--space-4)" ] ], [ "::margin-bottom", [ "::margin-bottom", "s1c0tki8", "margin-bottom:var(--space-4)" ] ], [ "::border-radius", [ "::border-radius", "s94jixf", "border-radius:6px" ] ], [ "::border", [ "::border", "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ]) ] ];
const demo_button = [ [ new Map([ [ "::padding-top", [ "::padding-top", "stbzxoc", "padding-top:var(--space-2)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyjk", "padding-bottom:var(--space-2)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vgu", "padding-left:var(--space-4)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdqs", "padding-right:var(--space-4)" ] ], [ "::font-family", [ "::font-family", "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ], [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "s30khfz", "color:var(--primary-on)" ] ], [ "::background-color", [ "::background-color", "s19dy6kf", "background-color:var(--primary)" ] ], [ "::border-radius", [ "::border-radius", "s94jixf", "border-radius:6px" ] ], [ "::border", [ "::border", "s1mnphwb", "border:none" ] ], [ "::transition", [ "::transition", "svhwf6a", "transition:opacity 80ms ease, transform 80ms ease" ] ], [ "::cursor", [ "::cursor", "s1onu0uk", "cursor:pointer" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ ":hover:opacity", [ ":hover:opacity", "s1eayhf7", "opacity:0.88" ] ], [ ":active:transform", [ ":active:transform", "s4vadmw", "transform:scale(0.95)" ] ] ]) ] ];
const demo_label = [ [ new Map([ [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ] ]) ] ];
const diag_pre = [ [ new Map([ [ "::overflow", [ "::overflow", "s19aluk0", "overflow:auto" ] ], [ "::padding", [ "::padding", "s1ufvrz", "padding:var(--space-5)" ] ], [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::line-height", [ "::line-height", "snq82np", "line-height:1.65" ] ], [ "::white-space", [ "::white-space", "s1oc7mru", "white-space:pre" ] ], [ "::background-color", [ "::background-color", "s1ydv2q1", "background-color:var(--down-normal)" ] ], [ "::border-radius", [ "::border-radius", "s94jixf", "border-radius:6px" ] ], [ "::border", [ "::border", "szq4juv", "border:1px solid rgb(from var(--primary) r g b / 0.35)" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-feature-settings", [ "::font-feature-settings", "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ]) ] ];
const diag_error = [ [ new Map([ [ "::font-weight", [ "::font-weight", "skjzhdq", "font-weight:700" ] ], [ "::color", [ "::color", "s1i5dkrp", "color:var(--primary)" ] ] ]) ] ];
const diag_frame = [ [ new Map([ [ "::color", [ "::color", "shpfnhp", "color:var(--up-dim)" ] ] ]) ] ];
const diag_stack = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::gap", [ "::gap", "s8myyqn", "gap:var(--space-3)" ] ], [ "::min-width", [ "::min-width", "sitgfdt", "min-width:0" ] ] ]) ] ];
const cards_grid = [ [ new Map([ [ "::display", [ "::display", "sbipssh", "display:grid" ] ], [ "::gap", [ "::gap", "s8myyrk", "gap:var(--space-4)" ] ], [ "::background", [ "::background", "sz4tuoy", "background:radial-gradient(340px circle at var(--glow-x, -999px) var(--glow-y, -999px), rgb(from var(--primary) r g b / 0.10), transparent 70%)" ] ], [ "640px::grid-template-columns", [ "640px::grid-template-columns", "sc664m5", "grid-template-columns:1fr 1fr" ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", "srts5oz", "grid-template-columns:1fr 1fr 1fr" ] ], [ "::--reveal", [ "::--reveal", "s1wraoya", "--reveal:1" ] ] ]) ] ];
const card = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::gap", [ "::gap", "s8myypq", "gap:var(--space-2)" ] ], [ "::padding", [ "::padding", "s1ufvrz", "padding:var(--space-5)" ] ], [ "::background-color", [ "::background-color", "s1ydv2q1", "background-color:var(--down-normal)" ] ], [ "::border-radius", [ "::border-radius", "s94jixf", "border-radius:6px" ] ], [ "::border", [ "::border", "s84iv6f", "border:1px solid var(--stroke-hard)" ] ], [ "::transition", [ "::transition", "s1g9l6sx", "transition:background-color 160ms ease, border-color 160ms ease" ] ], [ ":hover:background-color", [ ":hover:background-color", "s3ujeas", "background-color:var(--down-bright)" ] ], [ ":hover:border-color", [ ":hover:border-color", "s18zucc0", "border-color:rgb(from var(--primary) r g b / 0.45)" ] ] ]) ] ];
const card_title = [ [ new Map([ [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::font-family", [ "::font-family", "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ], [ "::font-size", [ "::font-size", "sayks1j", "font-size:20px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::line-height", [ "::line-height", "snq94bh", "line-height:28px" ] ], [ "::color", [ "::color", "s1miqier", "color:var(--up-bright)" ] ] ]) ] ];
const card_body = [ [ new Map([ [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ] ]) ] ];
const card_link = [ [ new Map([ [ "::align-self", [ "::align-self", "szfo4l9", "align-self:flex-start" ] ], [ "::display", [ "::display", "s2m9jw6", "display:inline-flex" ] ], [ "::gap", [ "::gap", "s8myyot", "gap:var(--space-1)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::color", [ "::color", "s1i5dkrp", "color:var(--primary)" ] ], [ "::text-decoration", [ "::text-decoration", "svrgm1f", "text-decoration:none" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ ":hover:text-decoration", [ ":hover:text-decoration", "s10pnzzh", "text-decoration:underline" ] ] ]) ] ];
const link_arrow = [ [ new Map([ [ "::width", [ "::width", "s178fql8", "width:14px" ] ], [ "::height", [ "::height", "s22x5ym", "height:14px" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", "svfmjlf", "-webkit-user-drag:none" ] ] ]) ] ];
const button_link_style = [ [ new Map([ [ "::align-self", [ "::align-self", "szfo4l9", "align-self:flex-start" ] ], [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::gap", [ "::gap", "s8myyot", "gap:var(--space-1)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::padding-top", [ "::padding-top", "stbzxoc", "padding-top:var(--space-2)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyjk", "padding-bottom:var(--space-2)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vgu", "padding-left:var(--space-4)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdqs", "padding-right:var(--space-4)" ] ], [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "s1i5dkrp", "color:var(--primary)" ] ], [ "::text-decoration", [ "::text-decoration", "svrgm1f", "text-decoration:none" ] ], [ "::border-radius", [ "::border-radius", "s94jixf", "border-radius:6px" ] ], [ "::border", [ "::border", "szq4kp4", "border:1px solid rgb(from var(--primary) r g b / 0.45)" ] ], [ "::transition", [ "::transition", "s1g9l6sx", "transition:background-color 160ms ease, border-color 160ms ease" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ ":hover:background-color", [ ":hover:background-color", "s12y9rv2", "background-color:rgb(from var(--primary) r g b / 0.12)" ] ], [ ":hover:border-color", [ ":hover:border-color", "s164fd6n", "border-color:var(--primary)" ] ] ]) ] ];
const card_icon = [ [ new Map([ [ "::width", [ "::width", "s178gloh", "width:28px" ] ], [ "::height", [ "::height", "s22y11v", "height:28px" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", "svfmjlf", "-webkit-user-drag:none" ] ] ]) ] ];
const dogfood_text = [ [ new Map([ [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::font-size", [ "::font-size", "sayk4ij", "font-size:15px" ] ], [ "::text-align", [ "::text-align", "s17ya8sq", "text-align:center" ] ] ]) ] ];
const dogfood_cta = [ [ new Map([ [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::text-align", [ "::text-align", "s17ya8sq", "text-align:center" ] ] ]) ] ];
const footer_block = [ [ new Map([ [ "::padding-top", [ "::padding-top", "sxfkz7k", "padding-top:128px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1ill0x0", "padding-bottom:128px" ] ], [ "::border-top", [ "::border-top", "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ]) ] ];
const footer_grid = [ [ new Map([ [ "::display", [ "::display", "sbipssh", "display:grid" ] ], [ "::gap", [ "::gap", "s8myyv8", "gap:var(--space-8)" ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", "s18vdyd9", "grid-template-columns:2fr 1fr 1fr 1fr" ] ] ]) ] ];
const footer_head = [ [ new Map([ [ "::margin-top", [ "::margin-top", "snx6qru", "margin-top:var(--space-2)" ] ], [ "::margin-bottom", [ "::margin-bottom", "s1c0tkge", "margin-bottom:var(--space-2)" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "s1miqier", "color:var(--up-bright)" ] ] ]) ] ];
const footer_list = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::gap", [ "::gap", "s8myypq", "gap:var(--space-2)" ] ] ]) ] ];
const footer_link = [ [ new Map([ [ "::color", [ "::color", "shpfnhp", "color:var(--up-dim)" ] ], [ "::text-decoration", [ "::text-decoration", "svrgm1f", "text-decoration:none" ] ], [ "::transition", [ "::transition", "sbcnc8a", "transition:color 80ms ease" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ ":hover:color", [ ":hover:color", "s1ytnaev", "color:var(--up-bright)" ] ], [ ":hover:text-decoration", [ ":hover:text-decoration", "s10pnzzh", "text-decoration:underline" ] ] ]) ] ];
const footer_mark = [ [ new Map([ [ "::align-self", [ "::align-self", "s1dnt31w", "align-self:center" ] ], [ "::justify-self", [ "::justify-self", "s1mm88t6", "justify-self:center" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", "svfmjlf", "-webkit-user-drag:none" ] ] ]) ] ];
const footer_micro = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::justify-content", [ "::justify-content", "s1yv3ji6", "justify-content:space-between" ] ], [ "::flex-wrap", [ "::flex-wrap", "szotvx1", "flex-wrap:wrap" ] ], [ "::gap", [ "::gap", "s8myypq", "gap:var(--space-2)" ] ], [ "::padding-top", [ "::padding-top", "stbzxs0", "padding-top:var(--space-6)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyn8", "padding-bottom:var(--space-6)" ] ], [ "::margin-top", [ "::margin-top", "s83cg9u", "margin-top:96px" ] ], [ "::font-size", [ "::font-size", "sayk1zs", "font-size:12px" ] ], [ "::color", [ "::color", "shpfnhp", "color:var(--up-dim)" ] ], [ "::border-top", [ "::border-top", "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ]) ] ];
const art_stage = [ [ new Map([ [ "::overflow", [ "::overflow", "syp1ckj", "overflow:hidden" ] ], [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::background-color", [ "::background-color", "s4e3ofu", "background-color:var(--down-dim)" ] ], [ "::--art-shadow", [ "::--art-shadow", "s18vcma9", "--art-shadow:var(--shadow)" ] ], [ "::--reveal", [ "::--reveal", "s1wraoya", "--reveal:1" ] ] ]) ] ];
const art_card = [ [ new Map([ [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::padding-top", [ "::padding-top", "stbzxq6", "padding-top:var(--space-4)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyle", "padding-bottom:var(--space-4)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vhr", "padding-left:var(--space-5)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdrp", "padding-right:var(--space-5)" ] ], [ "::background-color", [ "::background-color", "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ], [ "::border-radius", [ "::border-radius", "sh1avk2", "border-radius:14px" ] ], [ "::border", [ "::border", "s8ckzec", "border:1px solid var(--stroke-soft)" ] ], [ "::box-shadow", [ "::box-shadow", "szsnppy", "box-shadow:0 8px 40px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ]) ] ];
const art_tab = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk15j", "font-size:11px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::letter-spacing", [ "::letter-spacing", "s1ny1qxg", "letter-spacing:0.1em" ] ], [ "::text-transform", [ "::text-transform", "s1s2tj83", "text-transform:uppercase" ] ], [ "::margin-top", [ "::margin-top", "snx6qru", "margin-top:var(--space-2)" ] ], [ "::margin-bottom", [ "::margin-bottom", "s1c0tkge", "margin-bottom:var(--space-2)" ] ], [ "::opacity", [ "::opacity", "s30a1l5", "opacity:0.55" ] ] ]) ] ];
const art_code = [ [ new Map([ [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-size", [ "::font-size", "s24ary3", "font-size:12.5px" ] ], [ "::line-height", [ "::line-height", "s9bu6v5", "line-height:1.7" ] ], [ "::color", [ "::color", "s1hzt6rq", "color:rgb(from var(--up-bright) r g b / 0.92)" ] ], [ "::white-space", [ "::white-space", "s1oc7mru", "white-space:pre" ] ] ]) ] ];
const art_caption = [ [ new Map([ [ "::margin-top", [ "::margin-top", "snx6qto", "margin-top:var(--space-4)" ] ], [ "::margin-bottom", [ "::margin-bottom", "s1c0tki8", "margin-bottom:var(--space-4)" ] ], [ "::font-size", [ "::font-size", "sayk1zs", "font-size:12px" ] ], [ "::letter-spacing", [ "::letter-spacing", "s1odiaav", "letter-spacing:0.04em" ] ], [ "::text-align", [ "::text-align", "s17ya8sq", "text-align:center" ] ], [ "::opacity", [ "::opacity", "s30a1l5", "opacity:0.55" ] ] ]) ] ];
const dot_magenta = [ [ new Map([ [ "::width", [ "::width", "sgdl7ao", "width:9px" ] ], [ "::height", [ "::height", "s1wxwfsy", "height:9px" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::background-color", [ "::background-color", "s1i756l7", "background-color:#8B2786" ] ] ]) ] ];
const dot_orange = [ [ new Map([ [ "::width", [ "::width", "sgdl7ao", "width:9px" ] ], [ "::height", [ "::height", "s1wxwfsy", "height:9px" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::background-color", [ "::background-color", "s19dy6kf", "background-color:var(--primary)" ] ] ]) ] ];
const arrow_head_left = [ [ new Map([ [ "::width", [ "::width", "sgdl6gf", "width:8px" ] ], [ "::height", [ "::height", "s1wxweyp", "height:8px" ] ], [ "::background-color", [ "::background-color", "s19dy6kf", "background-color:var(--primary)" ] ], [ "::clip-path", [ "::clip-path", "s13bfwa8", "clip-path:polygon(100% 0, 0 50%, 100% 100%)" ] ], [ "::flex-shrink", [ "::flex-shrink", "s1lr51x", "flex-shrink:0" ] ] ]) ] ];
const arrow_head_right_rose = [ [ new Map([ [ "::width", [ "::width", "sgdl6gf", "width:8px" ] ], [ "::height", [ "::height", "s1wxweyp", "height:8px" ] ], [ "::background-color", [ "::background-color", "sumjtxl", "background-color:var(--accent)" ] ], [ "::clip-path", [ "::clip-path", "sdy8hnu", "clip-path:polygon(0 0, 100% 50%, 0 100%)" ] ], [ "::flex-shrink", [ "::flex-shrink", "s1lr51x", "flex-shrink:0" ] ] ]) ] ];
const arrow_head_right = [ [ new Map([ [ "::width", [ "::width", "sgdl6gf", "width:8px" ] ], [ "::height", [ "::height", "s1wxweyp", "height:8px" ] ], [ "::background-color", [ "::background-color", "s19dy6kf", "background-color:var(--primary)" ] ], [ "::clip-path", [ "::clip-path", "sdy8hnu", "clip-path:polygon(0 0, 100% 50%, 0 100%)" ] ], [ "::flex-shrink", [ "::flex-shrink", "s1lr51x", "flex-shrink:0" ] ] ]) ] ];
const dg_blob_top = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::filter", [ "::filter", "sc4alkf", "filter:blur(60px)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::left", [ "::left", "semvs7h", "left:30%" ] ], [ "::top", [ "::top", "s8i24vg", "top:-14%" ] ], [ "::width", [ "::width", "sgdl1ga", "width:42%" ] ], [ "::height", [ "::height", "s1wxwavk", "height:55%" ] ], [ "::background-image", [ "::background-image", "szxtch6", "background-image:radial-gradient(closest-side, rgba(178, 48, 86, 0.5) 0%, transparent 100%)" ] ] ]) ] ];
const dg_blob_left = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::filter", [ "::filter", "sc4alkf", "filter:blur(60px)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::left", [ "::left", "semvndb", "left:-8%" ] ], [ "::bottom", [ "::bottom", "s11gfv4k", "bottom:-18%" ] ], [ "::width", [ "::width", "sgdl0pp", "width:36%" ] ], [ "::height", [ "::height", "s1wxwast", "height:52%" ] ], [ "::background-image", [ "::background-image", "shcp77k", "background-image:radial-gradient(closest-side, rgba(103, 34, 131, 0.5) 0%, transparent 100%)" ] ] ]) ] ];
const dg_blob_right = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::filter", [ "::filter", "sc4alkf", "filter:blur(60px)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::right", [ "::right", "svx3j4l", "right:-8%" ] ], [ "::bottom", [ "::bottom", "s11gfv0w", "bottom:-14%" ] ], [ "::width", [ "::width", "sgdl0rj", "width:38%" ] ], [ "::height", [ "::height", "s1wxwast", "height:52%" ] ], [ "::background-image", [ "::background-image", "s5lsrvs", "background-image:radial-gradient(closest-side, rgba(235, 104, 46, 0.4) 0%, transparent 100%)" ] ] ]) ] ];
const dg_source = [ [ new Map([ [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::padding-top", [ "::padding-top", "stbzxq6", "padding-top:var(--space-4)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyle", "padding-bottom:var(--space-4)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vhr", "padding-left:var(--space-5)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdrp", "padding-right:var(--space-5)" ] ], [ "::background-color", [ "::background-color", "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ], [ "::border-radius", [ "::border-radius", "sh1avk2", "border-radius:14px" ] ], [ "::border", [ "::border", "s8ckzec", "border:1px solid var(--stroke-soft)" ] ], [ "::box-shadow", [ "::box-shadow", "szsnppy", "box-shadow:0 8px 40px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ], [ "::margin-left", [ "::margin-left", "s10oplpw", "margin-left:auto" ] ], [ "::margin-right", [ "::margin-right", "sp4tc1m", "margin-right:auto" ] ], [ "::max-width", [ "::max-width", "s1puqmpj", "max-width:460px" ] ] ]) ] ];
const dg_wire_zone = [ [ new Map([ [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::height", [ "::height", "s2310lv", "height:64px" ] ], [ "::display", [ "::display", "sbiv4i3", "display:none" ] ], [ "1024px::display", [ "1024px::display", "s1pon8d1", "display:block" ] ] ]) ] ];
const dg_wire_left = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::height", [ "::height", "s1wxw9x7", "height:2px" ] ], [ "::transform-origin", [ "::transform-origin", "soitk1p", "transform-origin:left center" ] ], [ "::left", [ "::left", "semvtvz", "left:50%" ] ], [ "::top", [ "::top", "s9a6ol", "top:8px" ] ], [ "::width", [ "::width", "s64rvxm", "width:210px" ] ], [ "::background-image", [ "::background-image", "sfb7qpy", "background-image:linear-gradient(270deg, #B23056 0%, #672283 100%)" ] ], [ "::transform", [ "::transform", "sxyfb32", "transform:translateX(-40px) rotate(160deg)" ] ] ]) ] ];
const dg_wire_right = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::height", [ "::height", "s1wxw9x7", "height:2px" ] ], [ "::transform-origin", [ "::transform-origin", "soitk1p", "transform-origin:left center" ] ], [ "::left", [ "::left", "semvtvz", "left:50%" ] ], [ "::top", [ "::top", "s9a6ol", "top:8px" ] ], [ "::width", [ "::width", "s64rvxm", "width:210px" ] ], [ "::background-image", [ "::background-image", "s10fot13", "background-image:linear-gradient(90deg, #D84730 0%, var(--primary) 100%)" ] ], [ "::transform", [ "::transform", "sllsl8", "transform:translateX(40px) rotate(20deg)" ] ] ]) ] ];
const dg_wire_label_left = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::top", [ "::top", "s8i65b9", "top:26px" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-size", [ "::font-size", "s23lcvu", "font-size:11.5px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "s9d85rj", "color:var(--accent)" ] ], [ "::left", [ "::left", "semvrgw", "left:24%" ] ] ]) ] ];
const dg_wire_label_right = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::top", [ "::top", "s8i65b9", "top:26px" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-size", [ "::font-size", "s23lcvu", "font-size:11.5px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "s9d85rj", "color:var(--accent)" ] ], [ "::right", [ "::right", "svx3n86", "right:24%" ] ] ]) ] ];
const dg_legs = [ [ new Map([ [ "::display", [ "::display", "sbipssh", "display:grid" ] ], [ "::gap", [ "::gap", "s8myyte", "gap:var(--space-6)" ] ], [ "::align-items", [ "::align-items", "s13ace9s", "align-items:stretch" ] ], [ "::margin-top", [ "::margin-top", "snx6qto", "margin-top:var(--space-4)" ] ], [ "::margin-bottom", [ "::margin-bottom", "s1c0tki8", "margin-bottom:var(--space-4)" ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", "s1tdau93", "grid-template-columns:1fr 230px 1fr" ] ] ]) ] ];
const dg_leg_head = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::gap", [ "::gap", "s8myypq", "gap:var(--space-2)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::margin-top", [ "::margin-top", "snx6qru", "margin-top:var(--space-2)" ] ], [ "::margin-bottom", [ "::margin-bottom", "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ]) ] ];
const dg_leg_name = [ [ new Map([ [ "::font-family", [ "::font-family", "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ], [ "::font-size", [ "::font-size", "sayk4ij", "font-size:15px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ] ]) ] ];
const dg_leg_env = [ [ new Map([ [ "::margin-left", [ "::margin-left", "s10oplpw", "margin-left:auto" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-size", [ "::font-size", "sayk15j", "font-size:11px" ] ], [ "::opacity", [ "::opacity", "s3a4es", "opacity:0.5" ] ] ]) ] ];
const dg_mid = [ [ new Map([ [ "::display", [ "::display", "sbiv4i3", "display:none" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::gap", [ "::gap", "s8myyrk", "gap:var(--space-4)" ] ], [ "::justify-content", [ "::justify-content", "s1d7ek7w", "justify-content:center" ] ], [ "1024px::display", [ "1024px::display", "s10b6u2h", "display:flex" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ] ]) ] ];
const dg_mid_label = [ [ new Map([ [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-size", [ "::font-size", "s23lcvu", "font-size:11.5px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::text-align", [ "::text-align", "s17ya8sq", "text-align:center" ] ], [ "::color", [ "::color", "s1i5dkrp", "color:var(--primary)" ] ] ]) ] ];
const dg_mid_label_rose = [ [ new Map([ [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-size", [ "::font-size", "s23lcvu", "font-size:11.5px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::text-align", [ "::text-align", "s17ya8sq", "text-align:center" ] ], [ "::color", [ "::color", "s9d85rj", "color:var(--accent)" ] ] ]) ] ];
const dg_line_row = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ] ]) ] ];
const dg_line = [ [ new Map([ [ "::flex", [ "::flex", "skj5p4u", "flex:1" ] ], [ "::height", [ "::height", "s1wxw9x7", "height:2px" ] ], [ "::background-color", [ "::background-color", "s19dy6kf", "background-color:var(--primary)" ] ] ]) ] ];
const dg_line_dashed = [ [ new Map([ [ "::flex", [ "::flex", "skj5p4u", "flex:1" ] ], [ "::height", [ "::height", "s1wxw9x7", "height:2px" ] ], [ "::background", [ "::background", "sc7epnf", "background:repeating-linear-gradient(90deg, var(--accent) 0 5px, transparent 5px 11px)" ] ], [ "::animation", [ "::animation", "s1dyc7rh", "animation:dash-flow 1.6s linear infinite" ] ] ]) ] ];
const dg_note = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk15j", "font-size:11px" ] ], [ "::text-align", [ "::text-align", "s17ya8sq", "text-align:center" ] ], [ "::opacity", [ "::opacity", "s3a4et", "opacity:0.6" ] ] ]) ] ];
const ed_blob_a = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::filter", [ "::filter", "sc4alkf", "filter:blur(60px)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::left", [ "::left", "semvqiz", "left:10%" ] ], [ "::top", [ "::top", "s8i25m1", "top:-20%" ] ], [ "::width", [ "::width", "sgdl34s", "width:62%" ] ], [ "::height", [ "::height", "s1wxwbn2", "height:62%" ] ], [ "::background-image", [ "::background-image", "swx3oin", "background-image:radial-gradient(closest-side, rgba(178, 48, 86, 0.55) 0%, transparent 100%)" ] ] ]) ] ];
const ed_blob_b = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::filter", [ "::filter", "sc4alkf", "filter:blur(60px)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::right", [ "::right", "s1mwnm2q", "right:-14%" ] ], [ "::bottom", [ "::bottom", "s11gfvrh", "bottom:-20%" ] ], [ "::width", [ "::width", "sgdl1ls", "width:48%" ] ], [ "::height", [ "::height", "s1wxwatq", "height:53%" ] ], [ "::background-image", [ "::background-image", "s1dm9aos", "background-image:radial-gradient(closest-side, rgba(235, 104, 46, 0.35) 0%, transparent 100%)" ] ] ]) ] ];
const ed_window = [ [ new Map([ [ "::overflow", [ "::overflow", "syp1ckj", "overflow:hidden" ] ], [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::margin-top", [ "::margin-top", "snx6qvi", "margin-top:var(--space-6)" ] ], [ "::margin-bottom", [ "::margin-bottom", "s1c0tkk2", "margin-bottom:var(--space-6)" ] ], [ "::background-color", [ "::background-color", "s1ydv2q1", "background-color:var(--down-normal)" ] ], [ "::border-radius", [ "::border-radius", "sh1atvk", "border-radius:12px" ] ], [ "::border", [ "::border", "s1m3negi", "border:1px solid rgb(from var(--up-bright) r g b / 0.14)" ] ], [ "::box-shadow", [ "::box-shadow", "s1qfnv05", "box-shadow:0 24px 80px rgb(from var(--art-shadow) r g b / calc(alpha * 0.6))" ] ] ]) ] ];
const ed_titlebar = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::gap", [ "::gap", "s8myypq", "gap:var(--space-2)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::padding-top", [ "::padding-top", "stbzxp9", "padding-top:var(--space-3)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiykh", "padding-bottom:var(--space-3)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vgu", "padding-left:var(--space-4)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdqs", "padding-right:var(--space-4)" ] ], [ "::background-color", [ "::background-color", "sxiw6xl", "background-color:rgb(from var(--up-bright) r g b / 0.04)" ] ], [ "::border-bottom", [ "::border-bottom", "spji67t", "border-bottom:1px solid rgb(from var(--up-bright) r g b / 0.08)" ] ] ]) ] ];
const ed_dot_red = [ [ new Map([ [ "::width", [ "::width", "s178fo2h", "width:11px" ] ], [ "::height", [ "::height", "s22x3fv", "height:11px" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::opacity", [ "::opacity", "s30a1nw", "opacity:0.85" ] ], [ "::background-color", [ "::background-color", "s1prq81g", "background-color:#D84730" ] ] ]) ] ];
const ed_dot_orange = [ [ new Map([ [ "::width", [ "::width", "s178fo2h", "width:11px" ] ], [ "::height", [ "::height", "s22x3fv", "height:11px" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::opacity", [ "::opacity", "s30a1nw", "opacity:0.85" ] ], [ "::background-color", [ "::background-color", "s19dy6kf", "background-color:var(--primary)" ] ] ]) ] ];
const ed_dot_magenta = [ [ new Map([ [ "::width", [ "::width", "s178fo2h", "width:11px" ] ], [ "::height", [ "::height", "s22x3fv", "height:11px" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::opacity", [ "::opacity", "s30a1nw", "opacity:0.85" ] ], [ "::background-color", [ "::background-color", "s1i756l7", "background-color:#8B2786" ] ] ]) ] ];
const ed_title = [ [ new Map([ [ "::margin-left", [ "::margin-left", "s10oplpw", "margin-left:auto" ] ], [ "::margin-right", [ "::margin-right", "sp4tc1m", "margin-right:auto" ] ], [ "::font-size", [ "::font-size", "sayk1zs", "font-size:12px" ] ], [ "::opacity", [ "::opacity", "s30a1l5", "opacity:0.55" ] ] ]) ] ];
const ed_body = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::padding-top", [ "::padding-top", "stbzxq6", "padding-top:var(--space-4)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyle", "padding-bottom:var(--space-4)" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::line-height", [ "::line-height", "snq90yh", "line-height:24px" ] ] ]) ] ];
const ed_gutter = [ [ new Map([ [ "::padding-right", [ "::padding-right", "s16t31ia", "padding-right:16px" ] ], [ "::width", [ "::width", "s178i1rz", "width:44px" ] ], [ "::text-align", [ "::text-align", "s1czd0mf", "text-align:right" ] ], [ "::white-space", [ "::white-space", "s1oc7mru", "white-space:pre" ] ], [ "::opacity", [ "::opacity", "s30a1ih", "opacity:0.28" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ] ]) ] ];
const ed_code = [ [ new Map([ [ "::overflow", [ "::overflow", "s19aluk0", "overflow:auto" ] ], [ "::color", [ "::color", "s1hzt6rq", "color:rgb(from var(--up-bright) r g b / 0.92)" ] ], [ "::white-space", [ "::white-space", "s1oc7mru", "white-space:pre" ] ] ]) ] ];
const ed_squiggle = [ [ new Map([ [ "::text-decoration", [ "::text-decoration", "s16zcev2", "text-decoration:underline wavy var(--art-error) 1.5px" ] ], [ "::text-underline-offset", [ "::text-underline-offset", "s1jf3sec", "text-underline-offset:5px" ] ] ]) ] ];
const ed_caret = [ [ new Map([ [ "::display", [ "::display", "sfatq7m", "display:inline-block" ] ], [ "::width", [ "::width", "sgdl1ex", "width:2px" ] ], [ "::height", [ "::height", "s22x6sv", "height:15px" ] ], [ "::background-color", [ "::background-color", "syz58y5", "background-color:var(--up-bright)" ] ], [ "::vertical-align", [ "::vertical-align", "s18wji4a", "vertical-align:text-bottom" ] ], [ "::margin-left", [ "::margin-left", "szjsw2c", "margin-left:1px" ] ], [ "::animation", [ "::animation", "s1fjlvgr", "animation:caret-blink 1.1s step-start infinite" ] ] ]) ] ];
const ed_hover = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::left", [ "::left", "s1ypvw5g", "left:clamp(120px, 30%, 185px)" ] ], [ "::top", [ "::top", "s1vku06o", "top:300px" ] ], [ "::padding-top", [ "::padding-top", "stbzxp9", "padding-top:var(--space-3)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiykh", "padding-bottom:var(--space-3)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vgu", "padding-left:var(--space-4)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdqs", "padding-right:var(--space-4)" ] ], [ "::width", [ "::width", "s1o8o1ug", "width:min(400px, 70%)" ] ], [ "::background-color", [ "::background-color", "ssxqr8g", "background-color:var(--down-bright)" ] ], [ "::border-radius", [ "::border-radius", "sh1as72", "border-radius:10px" ] ], [ "::border", [ "::border", "s1m3nek6", "border:1px solid rgb(from var(--up-bright) r g b / 0.18)" ] ], [ "::box-shadow", [ "::box-shadow", "s3qy95a", "box-shadow:0 16px 48px rgb(from var(--art-shadow) r g b / calc(alpha * 0.55))" ] ], [ "::z-index", [ "::z-index", "sehvv7j", "z-index:2" ] ] ]) ] ];
const ed_hover_error = [ [ new Map([ [ "::font-size", [ "::font-size", "s24ary3", "font-size:12.5px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::line-height", [ "::line-height", "s9bu6v4", "line-height:1.6" ] ], [ "::color", [ "::color", "s1r7vnvj", "color:var(--art-error)" ] ] ]) ] ];
const ed_hover_from = [ [ new Map([ [ "::margin-top", [ "::margin-top", "snx6qru", "margin-top:var(--space-2)" ] ], [ "::margin-bottom", [ "::margin-bottom", "s1c0tkge", "margin-bottom:var(--space-2)" ] ], [ "::font-size", [ "::font-size", "sayk15j", "font-size:11px" ] ], [ "::opacity", [ "::opacity", "s30a1k8", "opacity:0.45" ] ] ]) ] ];
const ed_statusbar = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::gap", [ "::gap", "s8myyrk", "gap:var(--space-4)" ] ], [ "::padding-top", [ "::padding-top", "stbzxoc", "padding-top:var(--space-2)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyjk", "padding-bottom:var(--space-2)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vgu", "padding-left:var(--space-4)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdqs", "padding-right:var(--space-4)" ] ], [ "::font-size", [ "::font-size", "sayk15j", "font-size:11px" ] ], [ "::border-top", [ "::border-top", "sxf8ud1", "border-top:1px solid rgb(from var(--up-bright) r g b / 0.08)" ] ], [ "::opacity", [ "::opacity", "s30a1l5", "opacity:0.55" ] ] ]) ] ];
const ed_problem = [ [ new Map([ [ "::color", [ "::color", "s1r7vnvj", "color:var(--art-error)" ] ] ]) ] ];
const ed_status_right = [ [ new Map([ [ "::margin-left", [ "::margin-left", "s10oplpw", "margin-left:auto" ] ] ]) ] ];
const tc_wrap = [ [ new Map([ [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::margin-left", [ "::margin-left", "s10oplpw", "margin-left:auto" ] ], [ "::margin-right", [ "::margin-right", "sp4tc1m", "margin-right:auto" ] ], [ "::width", [ "::width", "s667hsd", "width:420px" ] ], [ "::height", [ "::height", "s1wqggao", "height:430px" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::background-color", [ "::background-color", "s4e3ofu", "background-color:var(--down-dim)" ] ], [ "::--art-shadow", [ "::--art-shadow", "s18vcma9", "--art-shadow:var(--shadow)" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ] ]) ] ];
const tc_blob_a = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::filter", [ "::filter", "sc4alkf", "filter:blur(60px)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::left", [ "::left", "semvqqb", "left:18%" ] ], [ "::top", [ "::top", "s99zzy", "top:22%" ] ], [ "::width", [ "::width", "sgdl36m", "width:64%" ] ], [ "::height", [ "::height", "s1wxwayb", "height:58%" ] ], [ "::background-image", [ "::background-image", "smbhl57", "background-image:radial-gradient(closest-side, rgba(178, 48, 86, 0.6) 0%, transparent 100%)" ] ] ]) ] ];
const tc_blob_b = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::filter", [ "::filter", "sc4alkf", "filter:blur(60px)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::left", [ "::left", "s1xbl9by", "left:4%" ] ], [ "::top", [ "::top", "s1fnzz8s", "top:2%" ] ], [ "::width", [ "::width", "sgdl1i4", "width:44%" ] ], [ "::height", [ "::height", "s1wxw9yk", "height:42%" ] ], [ "::background-image", [ "::background-image", "s1rryo6p", "background-image:radial-gradient(closest-side, rgba(139, 39, 134, 0.5) 0%, transparent 100%)" ] ] ]) ] ];
const tc_blob_c = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::filter", [ "::filter", "sc4alkf", "filter:blur(60px)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::right", [ "::right", "svx3j0x", "right:-4%" ] ], [ "::bottom", [ "::bottom", "sv9p3z1", "bottom:-2%" ] ], [ "::width", [ "::width", "sgdl1jy", "width:46%" ] ], [ "::height", [ "::height", "s1wxwa28", "height:46%" ] ], [ "::background-image", [ "::background-image", "sqc5kkd", "background-image:radial-gradient(closest-side, rgba(235, 104, 46, 0.45) 0%, transparent 100%)" ] ] ]) ] ];
const tc_spoke_up = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::background-color", [ "::background-color", "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ], [ "::transform-origin", [ "::transform-origin", "soitk1p", "transform-origin:left center" ] ], [ "::left", [ "::left", "sr9jof4", "left:210px" ] ], [ "::top", [ "::top", "s8i9ux0", "top:70px" ] ], [ "::width", [ "::width", "sgdl0ko", "width:1px" ] ], [ "::height", [ "::height", "s1wod31f", "height:145px" ] ] ]) ] ];
const tc_spoke_down = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::background-color", [ "::background-color", "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ], [ "::transform-origin", [ "::transform-origin", "soitk1p", "transform-origin:left center" ] ], [ "::left", [ "::left", "sr9jof4", "left:210px" ] ], [ "::top", [ "::top", "s1vk5h1x", "top:215px" ] ], [ "::width", [ "::width", "sgdl0ko", "width:1px" ] ], [ "::height", [ "::height", "s1wod31f", "height:145px" ] ] ]) ] ];
const tc_spoke_run = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::background-color", [ "::background-color", "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ], [ "::transform-origin", [ "::transform-origin", "soitk1p", "transform-origin:left center" ] ], [ "::left", [ "::left", "sr9jof4", "left:210px" ] ], [ "::top", [ "::top", "s1vk5h1x", "top:215px" ] ], [ "::width", [ "::width", "s645n5d", "width:154px" ] ], [ "::height", [ "::height", "s1wxw92y", "height:1px" ] ], [ "::transform", [ "::transform", "s1cmm6dq", "transform:rotate(-28.2deg)" ] ] ]) ] ];
const tc_spoke_fmt = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::background-color", [ "::background-color", "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ], [ "::transform-origin", [ "::transform-origin", "soitk1p", "transform-origin:left center" ] ], [ "::left", [ "::left", "sr9jof4", "left:210px" ] ], [ "::top", [ "::top", "s1vk5h1x", "top:215px" ] ], [ "::width", [ "::width", "s645mb4", "width:153px" ] ], [ "::height", [ "::height", "s1wxw92y", "height:1px" ] ], [ "::transform", [ "::transform", "s1rnupr9", "transform:rotate(28.6deg)" ] ] ]) ] ];
const tc_spoke_lsp = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::background-color", [ "::background-color", "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ], [ "::transform-origin", [ "::transform-origin", "soitk1p", "transform-origin:left center" ] ], [ "::left", [ "::left", "sr9jof4", "left:210px" ] ], [ "::top", [ "::top", "s1vk5h1x", "top:215px" ] ], [ "::width", [ "::width", "s645jsd", "width:150px" ] ], [ "::height", [ "::height", "s1wxw92y", "height:1px" ] ], [ "::transform", [ "::transform", "ss7z4r2", "transform:rotate(151deg)" ] ] ]) ] ];
const tc_spoke_upgrade = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::background-color", [ "::background-color", "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ], [ "::transform-origin", [ "::transform-origin", "soitk1p", "transform-origin:left center" ] ], [ "::left", [ "::left", "sr9jof4", "left:210px" ] ], [ "::top", [ "::top", "s1vk5h1x", "top:215px" ] ], [ "::width", [ "::width", "s644xxv", "width:147px" ] ], [ "::height", [ "::height", "s1wxw92y", "height:1px" ] ], [ "::transform", [ "::transform", "s1tbwy2j", "transform:rotate(-150.3deg)" ] ] ]) ] ];
const tc_chip = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::gap", [ "::gap", "s8myypq", "gap:var(--space-2)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::padding-top", [ "::padding-top", "stbzxoc", "padding-top:var(--space-2)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyjk", "padding-bottom:var(--space-2)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vgu", "padding-left:var(--space-4)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdqs", "padding-right:var(--space-4)" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-size", [ "::font-size", "s24ary3", "font-size:12.5px" ] ], [ "::white-space", [ "::white-space", "s1ctk0je", "white-space:nowrap" ] ], [ "::background-color", [ "::background-color", "s1leb7x8", "background-color:rgb(from var(--down-normal) r g b / 0.92)" ] ], [ "::border-radius", [ "::border-radius", "s1t4wgdk", "border-radius:999px" ] ], [ "::border", [ "::border", "s1m3neic", "border:1px solid rgb(from var(--up-bright) r g b / 0.16)" ] ], [ "::box-shadow", [ "::box-shadow", "s1oql1iy", "box-shadow:0 6px 28px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ], [ "::transform", [ "::transform", "skw0huo", "transform:translate(-50%, -50%)" ] ] ]) ] ];
const led = [ [ new Map([ [ "::flex-shrink", [ "::flex-shrink", "s1lr51x", "flex-shrink:0" ] ], [ "::width", [ "::width", "sgdl5m6", "width:7px" ] ], [ "::height", [ "::height", "s1wxwe4g", "height:7px" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ] ]) ] ];
const tc_center_mask = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::left", [ "::left", "semvtvz", "left:50%" ] ], [ "::top", [ "::top", "s9a2gv", "top:50%" ] ], [ "::width", [ "::width", "s64uyum", "width:250px" ] ], [ "::height", [ "::height", "s1wocyu6", "height:140px" ] ], [ "::background-image", [ "::background-image", "s101azu3", "background-image:radial-gradient(closest-side, rgb(from var(--down-dim) r g b / 0.84) 35%, transparent 100%)" ] ], [ "::transform", [ "::transform", "skw0huo", "transform:translate(-50%, -50%)" ] ] ]) ] ];
const tc_center = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::left", [ "::left", "semvtvz", "left:50%" ] ], [ "::top", [ "::top", "s9a2gv", "top:50%" ] ], [ "::width", [ "::width", "s644s24", "width:140px" ] ], [ "::transform", [ "::transform", "skw0huo", "transform:translate(-50%, -50%)" ] ], [ "::aspect-ratio", [ "::aspect-ratio", "s1wfw2s5", "aspect-ratio:311 / 64" ] ], [ "::background-color", [ "::background-color", "syz58y5", "background-color:var(--up-bright)" ] ], [ "::-webkit-mask", [ "::-webkit-mask", "smlee52", "-webkit-mask:url(https://vilan-lang.org/assets/wordmark_hero_light.svg) center / contain no-repeat" ] ], [ "::mask", [ "::mask", "satia6u", "mask:url(https://vilan-lang.org/assets/wordmark_hero_light.svg) center / contain no-repeat" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", "svfmjlf", "-webkit-user-drag:none" ] ] ]) ] ];
const df_wrap = [ [ new Map([ [ "::display", [ "::display", "sbiv4i3", "display:none" ] ], [ "::overflow", [ "::overflow", "syp1ckj", "overflow:hidden" ] ], [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::padding-top", [ "::padding-top", "stbzxtu", "padding-top:var(--space-8)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyp2", "padding-bottom:var(--space-8)" ] ], [ "1024px::display", [ "1024px::display", "s1pon8d1", "display:block" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::background-color", [ "::background-color", "s4e3ofu", "background-color:var(--down-dim)" ] ], [ "::--art-shadow", [ "::--art-shadow", "s18vcma9", "--art-shadow:var(--shadow)" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ] ]) ] ];
const df_blob_a = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::filter", [ "::filter", "sc4alkf", "filter:blur(60px)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::left", [ "::left", "s1xbl9a4", "left:2%" ] ], [ "::top", [ "::top", "s8i26ga", "top:-30%" ] ], [ "::width", [ "::width", "sgdl0k7", "width:30%" ] ], [ "::height", [ "::height", "s22x2l5", "height:120%" ] ], [ "::background-image", [ "::background-image", "s1ffmfd1", "background-image:radial-gradient(closest-side, rgba(139, 39, 134, 0.45) 0%, transparent 100%)" ] ] ]) ] ];
const df_blob_b = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::border-radius", [ "::border-radius", "s94jge7", "border-radius:50%" ] ], [ "::filter", [ "::filter", "sc4alkf", "filter:blur(60px)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::right", [ "::right", "smhpc5c", "right:0%" ] ], [ "::top", [ "::top", "s8i25m1", "top:-20%" ] ], [ "::width", [ "::width", "sgdl0nv", "width:34%" ] ], [ "::height", [ "::height", "s22x2l5", "height:120%" ] ], [ "::background-image", [ "::background-image", "s1534wu5", "background-image:radial-gradient(closest-side, rgba(216, 71, 48, 0.5) 0%, transparent 100%)" ] ] ]) ] ];
const df_row = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::gap", [ "::gap", "s8myyrk", "gap:var(--space-4)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ] ]) ] ];
const df_node = [ [ new Map([ [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::padding-top", [ "::padding-top", "stbzxq6", "padding-top:var(--space-4)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyle", "padding-bottom:var(--space-4)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vhr", "padding-left:var(--space-5)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdrp", "padding-right:var(--space-5)" ] ], [ "::background-color", [ "::background-color", "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ], [ "::border-radius", [ "::border-radius", "sh1atvk", "border-radius:12px" ] ], [ "::border", [ "::border", "s8ckzec", "border:1px solid var(--stroke-soft)" ] ], [ "::box-shadow", [ "::box-shadow", "szsnppy", "box-shadow:0 8px 40px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ]) ] ];
const df_node_lit = [ [ new Map([ [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::padding-top", [ "::padding-top", "stbzxq6", "padding-top:var(--space-4)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1sgiyle", "padding-bottom:var(--space-4)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vhr", "padding-left:var(--space-5)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdrp", "padding-right:var(--space-5)" ] ], [ "::background-color", [ "::background-color", "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ], [ "::border-radius", [ "::border-radius", "sh1atvk", "border-radius:12px" ] ], [ "::border", [ "::border", "s8ckzec", "border:1px solid var(--stroke-soft)" ] ], [ "::box-shadow", [ "::box-shadow", "s1atclq1", "box-shadow:0 0 34px rgb(from var(--primary) r g b / 0.25), 0 8px 32px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ], [ "::border-color", [ "::border-color", "sgud36h", "border-color:rgb(from var(--primary) r g b / 0.6)" ] ] ]) ] ];
const df_tag = [ [ new Map([ [ "::font-size", [ "::font-size", "s22vxtl", "font-size:10.5px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::letter-spacing", [ "::letter-spacing", "s1ny1qxg", "letter-spacing:0.1em" ] ], [ "::text-transform", [ "::text-transform", "s1s2tj83", "text-transform:uppercase" ] ], [ "::margin-top", [ "::margin-top", "snx6qqx", "margin-top:var(--space-1)" ] ], [ "::margin-bottom", [ "::margin-bottom", "s1c0tkfh", "margin-bottom:var(--space-1)" ] ], [ "::opacity", [ "::opacity", "s3a4es", "opacity:0.5" ] ] ]) ] ];
const df_arrow = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::flex", [ "::flex", "skj5p4u", "flex:1" ] ], [ "::gap", [ "::gap", "s8myyot", "gap:var(--space-1)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ] ]) ] ];
const df_arrow_label = [ [ new Map([ [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-size", [ "::font-size", "s23lcvu", "font-size:11.5px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "s1i5dkrp", "color:var(--primary)" ] ] ]) ] ];
const df_arrow_row = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::width", [ "::width", "s178flj9", "width:100%" ] ] ]) ] ];
const code_pre = [ [ new Map([ [ "::overflow", [ "::overflow", "s19aluk0", "overflow:auto" ] ], [ "::padding", [ "::padding", "s1ufvrz", "padding:var(--space-5)" ] ], [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::line-height", [ "::line-height", "snq82np", "line-height:1.65" ] ], [ "::white-space", [ "::white-space", "s1oc7mru", "white-space:pre" ] ], [ "::background-color", [ "::background-color", "s1ydv2q1", "background-color:var(--down-normal)" ] ], [ "::border-radius", [ "::border-radius", "s94jixf", "border-radius:6px" ] ], [ "::border", [ "::border", "s84iv6f", "border:1px solid var(--stroke-hard)" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-feature-settings", [ "::font-feature-settings", "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ]) ] ];
const tk_keyword = [ [ new Map([ [ "::color", [ "::color", "s1i5dkrp", "color:var(--primary)" ] ] ]) ] ];
const tk_string = [ [ new Map([ [ "::color", [ "::color", "s9d85rj", "color:var(--accent)" ] ] ]) ] ];
const tk_plain = [ [ new Map([ [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ] ]) ] ];
const tk_callable = [ [ new Map([ [ "::color", [ "::color", "s1anp4hp", "color:var(--tint-callable)" ] ] ]) ] ];
const tk_type = [ [ new Map([ [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "s1miqier", "color:var(--up-bright)" ] ] ]) ] ];
const tk_hole = [ [ new Map([ [ "::color", [ "::color", "s1i5dkrp", "color:var(--primary)" ] ] ]) ] ];
const leaf_style = [ [ new Map([ [ "::padding-top", [ "::padding-top", "sku5qxi", "padding-top:1px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzsqi", "padding-bottom:1px" ] ], [ "::padding-left", [ "::padding-left", "srvufzf", "padding-left:6px" ] ], [ "::padding-right", [ "::padding-right", "s1rpv33l", "padding-right:6px" ] ], [ "::font-size", [ "::font-size", "sayk1zs", "font-size:12px" ] ], [ "::white-space", [ "::white-space", "s1ctk0je", "white-space:nowrap" ] ], [ "::background-color", [ "::background-color", "ssxqr8g", "background-color:var(--down-bright)" ] ], [ "::border-radius", [ "::border-radius", "s94jh8x", "border-radius:4px" ] ], [ "::border", [ "::border", "s84iv6f", "border:1px solid var(--stroke-hard)" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-feature-settings", [ "::font-feature-settings", "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ]) ] ];
const leaf_link_style = [ [ new Map([ [ "::padding-top", [ "::padding-top", "sku5qxi", "padding-top:1px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzsqi", "padding-bottom:1px" ] ], [ "::padding-left", [ "::padding-left", "srvufzf", "padding-left:6px" ] ], [ "::padding-right", [ "::padding-right", "s1rpv33l", "padding-right:6px" ] ], [ "::font-size", [ "::font-size", "sayk1zs", "font-size:12px" ] ], [ "::white-space", [ "::white-space", "s1ctk0je", "white-space:nowrap" ] ], [ "::background-color", [ "::background-color", "ssxqr8g", "background-color:var(--down-bright)" ] ], [ "::border-radius", [ "::border-radius", "s94jh8x", "border-radius:4px" ] ], [ "::border", [ "::border", "s84iv6f", "border:1px solid var(--stroke-hard)" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-feature-settings", [ "::font-feature-settings", "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ], [ "::color", [ "::color", "s1miqier", "color:var(--up-bright)" ] ], [ "::text-decoration", [ "::text-decoration", "s1hj754t", "text-decoration:underline dotted rgb(from var(--primary) r g b / 0.7) 1px" ] ], [ "::text-underline-offset", [ "::text-underline-offset", "s1jf3qpu", "text-underline-offset:3px" ] ], [ ":hover:border-color", [ ":hover:border-color", "s164fd6n", "border-color:var(--primary)" ] ] ]) ] ];
const bloom_field = [ [ new Map([ [ "::overflow", [ "::overflow", "syp1ckj", "overflow:hidden" ] ], [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::top", [ "::top", "s80ttlx", "top:0" ] ], [ "::left", [ "::left", "s8k3705", "left:0" ] ], [ "::width", [ "::width", "s178flj9", "width:100%" ] ], [ "::height", [ "::height", "sbp2tui", "height:calc(64px + clamp(1100px, 100vw, 1920px) * 0.570864)" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::--bloom-plum", [ "::--bloom-plum", "s1uiy6wn", "--bloom-plum:#95304D" ] ], [ "::--bloom-violet", [ "::--bloom-violet", "s6maw3t", "--bloom-violet:#8B2786" ] ], [ "::--bloom-scarlet", [ "::--bloom-scarlet", "s176vjaw", "--bloom-scarlet:#D84730" ] ] ]) ] ];
const bloom_drift = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::inset", [ "::inset", "s1ucbaf9", "inset:0" ] ], [ "::animation", [ "::animation", "s1u16gt0", "animation:bloom-drift-a 44s ease-in-out infinite alternate" ] ] ]) ] ];
const bloom_blurwrap = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::inset", [ "::inset", "s1ucbaf9", "inset:0" ] ], [ "::filter", [ "::filter", "sdxlu80", "filter:blur(calc(clamp(1100px, 100vw, 1920px) * 0.052)) saturate(1.25) brightness(1.12) url(#bloom-texture)" ] ] ]) ] ];
const bloom_gradient = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::left", [ "::left", "semvtvz", "left:50%" ] ], [ "::top", [ "::top", "s1ppzw09", "top:calc(64px - clamp(1100px, 100vw, 1920px) * 0.049226)" ] ], [ "::width", [ "::width", "s183om2p", "width:clamp(1100px, 100vw, 1920px)" ] ], [ "::height", [ "::height", "sst8zpc", "height:calc(clamp(1100px, 100vw, 1920px) * 0.62009)" ] ], [ "::transform", [ "::transform", "s183tt1x", "transform:translateX(-50%)" ] ], [ "::-webkit-mask-size", [ "::-webkit-mask-size", "sdml5s3", "-webkit-mask-size:100% 100%" ] ], [ "::mask-size", [ "::mask-size", "s14catfn", "mask-size:100% 100%" ] ], [ "::-webkit-mask-image", [ "::-webkit-mask-image", "ss9iuu0", "-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E  %3C/svg%3E \")" ] ], [ "::mask-image", [ "::mask-image", "sk413s", "mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E  %3C/svg%3E \")" ] ], [ "::background-image", [ "::background-image", "siub6a0", "background-image:radial-gradient(30% 10% ellipse at 61% 24%, rgb(226 184 231), rgb(247 229 249 / 70%) 74%, transparent 80%), radial-gradient(42% 40% ellipse at 62% 40%, rgb(255 106 0 / 95%), rgb(217 118 48 / 65%) 50%, transparent 78%), radial-gradient(61% 67% ellipse at 23% 48%, rgb(175 38 168 / 95%), rgb(237 64 7 / 60%) 45%, transparent 76%), radial-gradient(40% 46% ellipse at 92% 48%, rgba(216, 71, 48, 0.95), rgba(216, 71, 48, 0.7) 45%, transparent 78%), radial-gradient(26% 40% ellipse at 2% 50%, rgba(216, 71, 48, 0.9), transparent 74%), radial-gradient(36% 26% ellipse at 45% 78%, rgba(178, 48, 86, 0.7), transparent 76%), radial-gradient(22% 20% ellipse at 20% 84%, rgba(103, 34, 131, 0.8), transparent 74%), linear-gradient(100deg, var(--bloom-plum) 0%, var(--bloom-violet) 25%, var(--primary) 55%, var(--bloom-scarlet) 85%, var(--bloom-scarlet) 100%)" ] ], [ "::background-size", [ "::background-size", "s1as7syx", "background-size:calc(clamp(1100px, 100vw, 1920px) * 0.78125) calc(clamp(1100px, 100vw, 1920px) * 0.78125)" ] ] ]) ] ];
const bloom_duo = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::left", [ "::left", "semvtvz", "left:50%" ] ], [ "::top", [ "::top", "s1ppzw09", "top:calc(64px - clamp(1100px, 100vw, 1920px) * 0.049226)" ] ], [ "::width", [ "::width", "s183om2p", "width:clamp(1100px, 100vw, 1920px)" ] ], [ "::height", [ "::height", "sst8zpc", "height:calc(clamp(1100px, 100vw, 1920px) * 0.62009)" ] ], [ "::transform", [ "::transform", "s183tt1x", "transform:translateX(-50%)" ] ], [ "::-webkit-mask-size", [ "::-webkit-mask-size", "sdml5s3", "-webkit-mask-size:100% 100%" ] ], [ "::mask-size", [ "::mask-size", "s14catfn", "mask-size:100% 100%" ] ], [ "::-webkit-mask-image", [ "::-webkit-mask-image", "sthis8v", "-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg filter=\'url(%23filter0_f_51_26)\'%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E %3Cdefs%3E %3Cfilter id=\'filter0_f_51_26\' x=\'0\' y=\'-92.4345\' width=\'1877.72\' height=\'1164.39\' filterUnits=\'userSpaceOnUse\' color-interpolation-filters=\'sRGB\'%3E %3CfeFlood flood-opacity=\'0\' result=\'BackgroundImageFix\'/%3E %3CfeBlend mode=\'normal\' in=\'SourceGraphic\' in2=\'BackgroundImageFix\' result=\'shape\'/%3E %3CfeGaussianBlur stdDeviation=\'100\' result=\'effect1_foregroundBlur_51_26\'/%3E %3C/filter%3E %3C/defs%3E %3C/svg%3E \")" ] ], [ "::mask-image", [ "::mask-image", "sfm8fb3", "mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg filter=\'url(%23filter0_f_51_26)\'%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E %3Cdefs%3E %3Cfilter id=\'filter0_f_51_26\' x=\'0\' y=\'-92.4345\' width=\'1877.72\' height=\'1164.39\' filterUnits=\'userSpaceOnUse\' color-interpolation-filters=\'sRGB\'%3E %3CfeFlood flood-opacity=\'0\' result=\'BackgroundImageFix\'/%3E %3CfeBlend mode=\'normal\' in=\'SourceGraphic\' in2=\'BackgroundImageFix\' result=\'shape\'/%3E %3CfeGaussianBlur stdDeviation=\'100\' result=\'effect1_foregroundBlur_51_26\'/%3E %3C/filter%3E %3C/defs%3E %3C/svg%3E \")" ] ], [ "::background-image", [ "::background-image", "s13ldclz", "background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E %3Cfilter id=\'d\' x=\'0\' y=\'0\' width=\'100%25\' height=\'100%25\' color-interpolation-filters=\'sRGB\'%3E %3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'2\' numOctaves=\'3\' seed=\'3214\' stitchTiles=\'stitch\' result=\'n\'/%3E %3CfeColorMatrix in=\'n\' type=\'matrix\' values=\'1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1\' result=\'n1\'/%3E %3CfeColorMatrix in=\'n1\' type=\'luminanceToAlpha\' result=\'a\'/%3E %3CfeComponentTransfer in=\'a\' result=\'m1\'%3E%3CfeFuncA type=\'discrete\' tableValues=\'1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\'/%3E%3C/feComponentTransfer%3E %3CfeFlood flood-color=\'%23262324\' result=\'f1\'/%3E %3CfeComposite in=\'f1\' in2=\'m1\' operator=\'in\' result=\'dark\'/%3E %3CfeComponentTransfer in=\'a\' result=\'m2\'%3E%3CfeFuncA type=\'discrete\' tableValues=\'0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\'/%3E%3C/feComponentTransfer%3E %3CfeFlood flood-color=\'rgba(255, 89, 0, 0.57)\' result=\'f2\'/%3E %3CfeComposite in=\'f2\' in2=\'m2\' operator=\'in\' result=\'orange\'/%3E %3CfeMerge%3E%3CfeMergeNode in=\'dark\'/%3E%3CfeMergeNode in=\'orange\'/%3E%3C/feMerge%3E %3C/filter%3E %3Crect width=\'120\' height=\'120\' filter=\'url(%2523d)\'/%3E %3C/svg%3E\")" ] ], [ "::background-size", [ "::background-size", "skugn91", "background-size:120px 120px" ] ], [ "::mix-blend-mode", [ "::mix-blend-mode", "s1ddx1v8", "mix-blend-mode:soft-light" ] ] ]) ] ];
const masthead_wrap = [ [ new Map([ [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ] ]) ] ];
const hero_block = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::position", [ "::position", "s16f1e6t", "position:relative" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::gap", [ "::gap", "s1pnyybd", "gap:calc(clamp(1100px, 100vw, 1920px) * 0.03333)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::padding-top", [ "::padding-top", "srk904b", "padding-top:calc(clamp(1100px, 100vw, 1920px) * 0.15208)" ] ], [ "::height", [ "::height", "ss654zr", "height:calc(clamp(1100px, 100vw, 1920px) * 0.52917)" ] ], [ "::box-sizing", [ "::box-sizing", "s9fgd5j", "box-sizing:border-box" ] ] ]) ] ];
const hero_mark = [ [ new Map([ [ "::width", [ "::width", "s1t71824", "width:calc(clamp(1100px, 100vw, 1920px) * 0.05208)" ] ], [ "::height", [ "::height", "s23znoa", "height:auto" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", "svfmjlf", "-webkit-user-drag:none" ] ] ]) ] ];
const hero_wordmark = [ [ new Map([ [ "::width", [ "::width", "s1tv0w0m", "width:calc(clamp(1100px, 100vw, 1920px) * 0.16198)" ] ], [ "::height", [ "::height", "s23znoa", "height:auto" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", "svfmjlf", "-webkit-user-drag:none" ] ] ]) ] ];
const hero_tagline = [ [ new Map([ [ "::font-family", [ "::font-family", "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ], [ "::font-size", [ "::font-size", "s169txcv", "font-size:max(18px, clamp(1100px, 100vw, 1920px) * 0.01667)" ] ], [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::line-height", [ "::line-height", "s9bu6v3", "line-height:1.5" ] ], [ "::text-align", [ "::text-align", "s17ya8sq", "text-align:center" ] ], [ "::color", [ "::color", "s15t7ncn", "color:#120004" ] ] ]) ] ];
const primary = [ "var(--primary)", ":root{--primary:#EB682E}@media (prefers-color-scheme: light){:root{--primary:#AE3611}}" ];
const accent = [ "var(--accent)", ":root{--accent:#E5AFD9}@media (prefers-color-scheme: light){:root{--accent:#922A7C}}" ];
const assets = "https://vilan-lang.org/assets";
const repo = "https://github.com/vilan-lang/vilan";
const shell = [ [ new Map([ [ "::min-height", [ "::min-height", "sondrfd", "min-height:100%" ] ], [ "::font-family", [ "::font-family", "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ], [ "::font-size", [ "::font-size", "sayk3oa", "font-size:14px" ] ], [ "::line-height", [ "::line-height", "snq8cl8", "line-height:18px" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::background-color", [ "::background-color", "s4e3ofu", "background-color:var(--down-dim)" ] ] ]) ] ];
const column = [ [ new Map([ [ "::padding-left", [ "::padding-left", "s1vtg8d6", "padding-left:32px" ] ], [ "::padding-right", [ "::padding-right", "s16t4hls", "padding-right:32px" ] ], [ "::margin-left", [ "::margin-left", "s10oplpw", "margin-left:auto" ] ], [ "::margin-right", [ "::margin-right", "sp4tc1m", "margin-right:auto" ] ], [ "::max-width", [ "::max-width", "s1eamei2", "max-width:1264px" ] ] ]) ] ];
const no_drag = [ [ new Map([ [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", "svfmjlf", "-webkit-user-drag:none" ] ] ]) ] ];
const section_block = [ [ new Map([ [ "::padding-top", [ "::padding-top", "s18lh5xs", "padding-top:var(--space-24)" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1v942yc", "padding-bottom:var(--space-24)" ] ] ]) ] ];
const stack = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::gap", [ "::gap", "s8myyrk", "gap:var(--space-4)" ] ] ]) ] ];
const reveal = [ [ new Map([ [ "::--reveal", [ "::--reveal", "s1wraoya", "--reveal:1" ] ] ]) ] ];
const heading = [ [ new Map([ [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::font-family", [ "::font-family", "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ], [ "::font-size", [ "::font-size", "sayllga", "font-size:32px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::line-height", [ "::line-height", "snqanrz", "line-height:48px" ] ], [ "::color", [ "::color", "s1miqier", "color:var(--up-bright)" ] ], [ "::--reveal", [ "::--reveal", "s1wraoya", "--reveal:1" ] ] ]) ] ];
const lead = [ [ new Map([ [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::max-width", [ "::max-width", "s1pu2qte", "max-width:36rem" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::--reveal", [ "::--reveal", "s1wraoya", "--reveal:1" ] ] ]) ] ];
const rule_line = [ [ new Map([ [ "::height", [ "::height", "s1wxw92y", "height:1px" ] ], [ "::background-color", [ "::background-color", "s1hcpyu4", "background-color:var(--stroke-soft)" ] ] ]) ] ];
const grain_overlay = [ [ new Map([ [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::inset", [ "::inset", "s1ucbaf9", "inset:0" ] ], [ "::opacity", [ "::opacity", "s30a1l5", "opacity:0.55" ] ], [ "::mix-blend-mode", [ "::mix-blend-mode", "sc8sqhh", "mix-blend-mode:overlay" ] ], [ "::background-image", [ "::background-image", "s192ko3e", "background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'240\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'240\' height=\'240\' filter=\'url(%23n)\' opacity=\'0.55\'/%3E%3C/svg%3E\")" ] ], [ "::pointer-events", [ "::pointer-events", "s171fk3p", "pointer-events:none" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ] ]) ] ];
const visually_hidden = [ [ new Map([ [ "::overflow", [ "::overflow", "syp1ckj", "overflow:hidden" ] ], [ "::position", [ "::position", "s58iza0", "position:absolute" ] ], [ "::width", [ "::width", "sgdl0ko", "width:1px" ] ], [ "::height", [ "::height", "s1wxw92y", "height:1px" ] ], [ "::clip-path", [ "::clip-path", "sx3450x", "clip-path:inset(50%)" ] ] ]) ] ];
const topbar = [ [ new Map([ [ "::position", [ "::position", "s1onro1c", "position:sticky" ] ], [ "::top", [ "::top", "s80ttlx", "top:0" ] ], [ "::z-index", [ "::z-index", "si5ywm6", "z-index:100" ] ], [ "::background-color", [ "::background-color", "s1dq5yi8", "background-color:rgb(from var(--down-dim) r g b / calc(var(--nav-fade, 0) * 0.86))" ] ], [ "::border-bottom", [ "::border-bottom", "sc9brgc", "border-bottom:1px solid rgb(from var(--stroke-hard) r g b / calc(var(--nav-fade, 0) * 0.9))" ] ], [ "::backdrop-filter", [ "::backdrop-filter", "shx44pg", "backdrop-filter:blur(calc(var(--nav-fade, 0) * 14px))" ] ] ]) ] ];
const nav_row = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::justify-content", [ "::justify-content", "s1yv3ji6", "justify-content:space-between" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::height", [ "::height", "s2310lv", "height:64px" ] ] ]) ] ];
const nav_brand = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::gap", [ "::gap", "s8myyqn", "gap:var(--space-3)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::letter-spacing", [ "::letter-spacing", "s1odkmbv", "letter-spacing:0.35em" ] ] ]) ] ];
const nav_mark = [ [ new Map([ [ "::display", [ "::display", "sowfjmu", "display:block" ] ], [ "::width", [ "::width", "s178hbq8", "width:36px" ] ], [ "::height", [ "::height", "s22x9bm", "height:18px" ] ], [ "::background-color", [ "::background-color", "syz58y5", "background-color:var(--up-bright)" ] ], [ "::-webkit-mask", [ "::-webkit-mask", "scqkrg6", "-webkit-mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ], [ "::mask", [ "::mask", "s11mtiwm", "mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ]) ] ];
const nav_links = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::gap", [ "::gap", "s8myyte", "gap:var(--space-6)" ] ] ]) ] ];
const nav_link = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::text-decoration", [ "::text-decoration", "svrgm1f", "text-decoration:none" ] ], [ "::transition", [ "::transition", "sbcnc8a", "transition:color 80ms ease" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ ":hover:color", [ ":hover:color", "s1ytnaev", "color:var(--up-bright)" ] ] ]) ] ];
const scroll_fade = $a("0");
mount_root("app", ($c) => {
	return page(scroll_fade, (text2) => {
		return navigator.clipboard.writeText(text2);
	}, [ 1 ], $c, [ 1 ]);
});
const passive = JSON.parse("{\"passive\": true}");
const probe = document.querySelector("html");
const reduced_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const targets = document.querySelectorAll("." + class_list(reveal));
const viewport = probe.clientHeight;
let $dw = null;
if (!(reduced_motion)) {
	for (const target of targets) {
		if (target.getBoundingClientRect().top > viewport - 40.0) {
			target.style.setProperty("opacity", "0");
			target.style.setProperty("transform", "translateY(28px)");
		}
	}
	$dw = undefined;
}
$dw;
const publish = () => {
	return $aM([ 1 ], ($dx) => {
		const progress = Math.max(Math.min(probe.scrollTop / 64.0, 1.0), 0.0);
		$av(scroll_fade, "" + progress, [ 0, $dx ]);
		let $dy = null;
		if (!(reduced_motion)) {
			const line = probe.clientHeight * 0.92;
			for (const target2 of targets) {
				if (target2.getBoundingClientRect().top < line) {
					target2.style.setProperty("transition", "opacity 600ms ease, transform 600ms ease");
					target2.style.setProperty("opacity", "1");
					target2.style.setProperty("transform", "none");
				}
			}
			$dy = undefined;
		}
		return $dy;
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
