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
function __nursery_has_spawned(n) {
	return n.children.length > 0;
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
function __nursery_of(option) {
	return option[0] === 0 ? option[1] : undefined;
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
	return $N(self[0].v) && $N(self[1].v);
}
function enqueue(turn, subscribers) {
	for (const subscriber of subscribers) {
		const key = hash2(subscriber[0]);
		let $aD = null;
		if (subscriber[3]) {
			if (!(turn[3].v.has(key))) {
				turn[3].v.set(key, true);
				turn[1].v.push(__clone(subscriber));
			}
			$aD = undefined;
		} else if (!(turn[2].v.has(key))) {
			turn[2].v.set(key, true);
			let index = turn[0].v.length;
			while (index > 0 && __at(turn[0].v, index - 1)[0] > subscriber[0]) {
				index = index - 1;
			}
			__insert_at(turn[0].v, index, __clone(subscriber));
		}
		$aD;
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
				while (!($N(turn[1].v)) && budget > 0) {
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
	const $cD = turn;
	let $cE = null;
	if ($cD[0] === 0) {
		const ambient = $cD[1];
		$cE = enqueue(ambient, [ reissued(subscriber) ]);
	} else {
		const $cF = $M(draining_turns.v);
		let $cG = null;
		if ($cF[0] === 0) {
			const draining = $cF[1];
			$cG = enqueue(draining, [ reissued(subscriber) ]);
		} else {
			if (subscriber[2].v) {
				subscriber[1]();
			}
			$cG = undefined;
		}
		$cE = $cG;
	}
	return $cE;
}
function reissued(subscriber) {
	return [ subscriber[0], subscriber[1], subscriber[2], subscriber[3] ];
}
function wake(subscriber) {
	defer_subscriber([ 1 ], subscriber);
}
function dispose(self, $J) {
	const $K = $J;
	let $L = null;
	if ($K[0] === 0) {
		const established = $K[1];
		$L = [ 0, established ];
	} else {
		$L = $M(draining_turns.v);
	}
	const ambient = $L;
	release_under(self, ambient);
}
function detach(handle) {
	const $cK = $cH(releasing_turns.v);
	let $cL = null;
	if ($cK[0] === 0) {
		const at_release = $cK[1];
		$cL = at_release;
	} else {
		$cL = $M(draining_turns.v);
	}
	const turn = $cL;
	release_under(handle, turn);
}
function release_under(handle, ambient) {
	handle[2].v = false;
	const $P = [ 0, handle[0] ];
	let $Q = null;
	if ($P[0] === 0) {
		const subscribers = $P[1];
		let kept = [  ];
		for (const subscriber of subscribers.v) {
			if (subscriber[0] !== handle[1]) {
				kept.push(__clone(subscriber));
			}
		}
		subscribers.v = kept;
		$Q = undefined;
	} else {
		$Q = undefined;
	}
	$Q;
	const $R = ambient;
	let $S = null;
	if ($R[0] === 0) {
		const turn = $R[1];
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
		$S = undefined;
	} else {
		$S = undefined;
	}
	$S;
	const $T = handle[3].v;
	let $U = null;
	if ($T[0] === 0) {
		const release = $T[1];
		handle[3].v = [ 1 ];
		releasing_turns.v.push(ambient);
		__with_finally(release, () => {
			__list_pop(releasing_turns.v);
			return;
		});
		$U = undefined;
	} else {
		$U = undefined;
	}
	return $U;
}
function new3() {
	return [ __shared_new([ 0, no_cleanups, false, [ 1 ] ]), 0 ];
}
function is_disposed(self) {
	return self[0].v[0] !== self[1];
}
function defer(self, cleanup) {
	let $V = null;
	if (is_disposed(self)) {
		cleanup();
	} else {
		if (self[0].v[2]) {
			self[0].v[1].v.push(cleanup);
		} else {
			owner_lists_allocated_count.v = owner_lists_allocated_count.v + 1;
			self[0].v[1] = __shared_new([ cleanup ]);
			self[0].v[2] = true;
		}
		$V = undefined;
	}
	return $V;
}
function renew(self) {
	const $bY = self[0].v[3];
	let $bZ = null;
	if ($bY[0] === 0) {
		const nursery2 = __clone($bY[1]);
		let $ca = null;
		if (has_spawned(nursery2)) {
			$ca = [ 1 ];
		} else {
			$ca = [ 0, nursery2 ];
		}
		$bZ = $ca;
	} else {
		$bZ = [ 1 ];
	}
	const carried = $bZ;
	advance([ self[0], self[0].v[0] ], carried);
	if ($cd(self[0].v[3])) {
		run_nurseries_allocated_count.v = run_nurseries_allocated_count.v + 1;
		self[0].v[3] = [ 0, detached_nursery() ];
	}
	return [ self[0], self[0].v[0] ];
}
function nursery(self) {
	let $cn = null;
	if (is_disposed(self)) {
		$cn = [ 1 ];
	} else {
		$cn = self[0].v[3];
	}
	return $cn;
}
function dispose2(self) {
	advance(self, [ 1 ]);
}
function advance(self, carried) {
	let $cm = null;
	if (!(is_disposed(self))) {
		const held = self[0].v;
		self[0].v = [ self[1] + 1, no_cleanups, false, carried ];
		const $cb = held[3];
		let $cc = null;
		if ($cb[0] === 0) {
			const nursery2 = $cb[1];
			if ($cd(carried)) {
				nursery2.cancel();
			}
			$cc = undefined;
		} else {
			$cc = undefined;
		}
		$cc;
		let $cl = null;
		if (held[2]) {
			let failure = [ 1 ];
			for (const cleanup of held[1].v) {
				const $cf = __guarded(cleanup);
				let $cg = null;
				if ($cf[0] === 0) {
					const message = $cf[1];
					if ($cd(failure)) {
						failure = [ 0, message ];
					}
					$cg = undefined;
				} else {
					$cg = undefined;
				}
				$cg;
			}
			const $cj = failure;
			let $ck = null;
			if ($cj[0] === 0) {
				const message2 = $cj[1];
				$ck = (() => {
					throw message2;
				})();
			} else {
				$ck = undefined;
			}
			$cl = $ck;
		}
		$cm = $cl;
	}
	return $cm;
}
function get_owner($z) {
	return $z;
}
function release_runs(runs) {
	dispose2([ runs[0], runs[0].v[0] ]);
}
function new_tracker() {
	return [ __shared_new([ 0, false, false, false, false, [ 1 ], [ 1 ] ]) ];
}
function open_run(tracker) {
	const epoch = tracker[0].v[0] + 1;
	tracker[0].v[0] = epoch;
	tracker[0].v[1] = true;
	tracker[0].v[2] = false;
	const $bR = tracker[0].v[6];
	let $bS = null;
	if ($bR[0] === 0) {
		const lists = $bR[1];
		if (!($N(lists.v[0]))) {
			lists.v[0] = [  ];
		}
		$bS = undefined;
	} else {
		$bS = undefined;
	}
	$bS;
	return [ __clone(tracker), epoch ];
}
function close_run(tracker) {
	tracker[0].v[1] = false;
	const $cs = tracker[0].v[6];
	let $ct = null;
	if ($cs[0] === 0) {
		const lists = $cs[1];
		$ct = lists;
	} else {
		return;
		$ct = undefined;
	}
	const lists2 = $ct;
	const $cu = tracker[0].v[5];
	let $cv = null;
	if ($cu[0] === 0) {
		const target2 = __clone($cu[1]);
		$cv = reconnect(tracker, lists2, target2);
	} else {
		if (!($N(lists2.v[0])) || !($N(lists2.v[1]))) {
			lists2.v[1] = __clone(lists2.v[0]);
		}
		$cv = undefined;
	}
	$cv;
	if (!($N(lists2.v[0]))) {
		lists2.v[0] = [  ];
	}
}
function reconnect(tracker, lists, target2) {
	if ($N(lists.v[0]) && $N(lists.v[2])) {
		return;
	}
	const held = __clone(lists.v[2]);
	const reading = __clone(lists.v[0]);
	let kept = [  ];
	for (const _edge of held) {
		kept.push(false);
	}
	let next = [  ];
	tracker[0].v[3] = true;
	let position = 0;
	for (const dependency of reading) {
		const $cB = reusable(held, kept, dependency[0], position);
		let $cC = null;
		if ($cB[0] === 0) {
			const index = $cB[1];
			__at_put(kept, index, true);
			next.push(__clone(__at(held, index)));
			$cC = undefined;
		} else {
			next.push([ dependency[0], dependency[1](relay_for(tracker, target2)) ]);
			$cC = undefined;
		}
		$cC;
		position = position + 1;
	}
	lists.v[2] = next;
	let index2 = 0;
	for (const edge of held) {
		if (!(__at(kept, index2))) {
			detach(edge[1]);
		}
		index2 = index2 + 1;
	}
	tracker[0].v[3] = false;
}
function reusable(held, kept, identity, position) {
	const $cx = identity;
	let $cy = null;
	if ($cx[0] === 0) {
		const wanted = $cx[1];
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
		$cy = [ 1 ];
	} else {
		$cy = [ 1 ];
	}
	return $cy;
}
function same_identity(identity, wanted) {
	const $cz = identity;
	let $cA = null;
	if ($cz[0] === 0) {
		const held = $cz[1];
		$cA = held === wanted;
	} else {
		$cA = false;
	}
	return $cA;
}
function relay_for(tracker, target2) {
	return subscriber_of(() => {
		const connecting = tracker[0].v[3];
		tracker[0].v[2] = true;
		if (connecting) {
			tracker[0].v[4] = true;
		} else {
			wake(target2);
		}
		return;
	}, true);
}
function attach_tracker(tracker, target2) {
	tracker[0].v[5] = [ 0, __clone(target2) ];
	const $cP = tracker[0].v[6];
	let $cQ = null;
	if ($cP[0] === 0) {
		const lists = $cP[1];
		$cQ = lists;
	} else {
		return;
		$cQ = undefined;
	}
	const lists2 = $cQ;
	let $cR = null;
	if (!($N(lists2.v[1]))) {
		const read = __clone(lists2.v[1]);
		lists2.v[1] = [  ];
		tracker[0].v[3] = true;
		let edges = [  ];
		for (const dependency of read) {
			edges.push([ dependency[0], dependency[1](relay_for(tracker, target2)) ]);
		}
		lists2.v[2] = edges;
		tracker[0].v[3] = false;
		if (tracker[0].v[4]) {
			tracker[0].v[4] = false;
			wake(target2);
		}
		$cR = undefined;
	}
	return $cR;
}
function forget_reads(tracker) {
	const $cS = tracker[0].v[6];
	let $cT = null;
	if ($cS[0] === 0) {
		const lists = $cS[1];
		$cT = lists;
	} else {
		return;
		$cT = undefined;
	}
	const lists2 = $cT;
	let $cU = null;
	if (!($N(lists2.v[2]))) {
		const edges = __clone(lists2.v[2]);
		lists2.v[2] = [  ];
		for (const edge of edges) {
			detach(edge[1]);
		}
		$cU = undefined;
	}
	$cU;
	if (!($N(lists2.v[1]))) {
		lists2.v[1] = [  ];
	}
}
function detach_tracker(tracker) {
	tracker[0].v[5] = [ 1 ];
	forget_reads(tracker);
}
function also_releasing(handle, release) {
	const previous = handle[3].v;
	handle[3].v = [ 0, () => {
		release();
		const $cV = previous;
		let $cW = null;
		if ($cV[0] === 0) {
			const earlier = $cV[1];
			$cW = earlier();
		} else {
			$cW = undefined;
		}
		return $cW;
	} ];
}
function has_spawned(self) {
	return __nursery_has_spawned(self);
}
function ambient_signal($aK) {
	const $aL = $aK;
	let $aM = null;
	if ($aL[0] === 0) {
		const n = $aL[1];
		$aM = [ 0, n.signal_of() ];
	} else {
		$aM = [ 1 ];
	}
	return $aM;
}
function detached_nursery() {
	return __nursery_new_detached();
}
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $aJ) {
	return await (self[0].wait(ambient_signal($aJ)));
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
		return $aO([ 1 ], ($aN) => {
			return (() => {
				return handler($aN, [ 1 ]);
			})();
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
	const $dN = $aO([ 1 ], ($dK) => {
		return $dL(body);
	});
	const built = $dN[0];
	const root = $dN[1];
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
	const $ac = property;
	let $ad = null;
	if ($ac === "padding") {
		$ad = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($ac === "margin") {
		$ad = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($ac === "inset") {
		$ad = ";top;right;bottom;left;";
	} else if ($ac === "flex") {
		$ad = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($ac === "background") {
		$ad = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($ac === "border") {
		$ad = border_longhands();
	} else {
		$ad = "";
	}
	return $ad;
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
	for (const key of $W(rules)) {
		const slot = slot_of(key);
		if (slot[0] === media && slot[1] === condition && longhands.includes(";" + slot[2] + ";")) {
			$ae(out, key);
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
	for (const key of $W(b[0])) {
		const $aa = $X(b[0], key);
		let $ab = null;
		if ($aa[0] === 0) {
			const entry = $aa[1];
			const slot = slot_of(key);
			rules = without_covered(rules, slot[0], slot[1], slot[2]);
			$af(rules, key, entry);
			$ab = undefined;
		} else {
			$ab = undefined;
		}
		$ab;
	}
	return [ rules ];
}
function page(scroll_fade2, copy, $d, $e, $f) {
	return $n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n(styled(view("div"), shell), bloom($d, $e), $d, $e), top_bar(scroll_fade2, $d, $e), $d, $e), masthead($d, $e), $d, $e), divider($d, $e), $d, $e), install_section(copy, $d, $e, $f), $d, $e), divider($d, $e), $d, $e), showcase_reactive($d, $e), $d, $e), divider($d, $e), $d, $e), showcase_fullstack($d, $e), $d, $e), divider($d, $e), $d, $e), showcase_compiler($d, $e), $d, $e), divider($d, $e), $d, $e), editor_band($d, $e), $d, $e), divider($d, $e), $d, $e), feature_grid($d, $e), $d, $e), divider($d, $e), $d, $e), dogfood($d, $e), $d, $e), page_footer($d, $e), $d, $e);
}
function install_row(label, command, copy, $as, $at, $au) {
	const icon = $a("" + assets + "/icons/copy.svg");
	const pending = __shared_new([ 1 ]);
	return $n($n(view("div"), text(styled(view("p"), install_label), label), $as, $at), $n($n(styled(view("div"), install_command), text(styled(view("span"), install_command_text), command), $as, $at), $n(on($ag(styled(view("button"), copy_button), "aria-label", "Copy command", $as, $at), "click", ($av, $aw) => {
		copy(command);
		$ax(icon, "" + assets + "/icons/check.svg", [ 0, $av ]);
		const $aH = pending.v;
		let $aI = null;
		if ($aH[0] === 0) {
			const timer = $aH[1];
			$aI = cancel(timer);
		} else {
			$aI = undefined;
		}
		$aI;
		const timer2 = after(2400);
		pending.v = [ 0, __clone(timer2) ];
		__task(async () => {
			if (await (wait(timer2, $au))) {
				$ax(icon, "" + assets + "/icons/copy.svg", [ 0, $av ]);
			}
			return;
		}, "install_row", __nursery_of($au));
		return;
	}), $aP($ag(styled(view("img"), copy_icon), "alt", "", $as, $at), "src", __clone(icon), $as, $at), $as, $at), $as, $at), $as, $at);
}
function install_section(copy, $ap, $aq, $ar) {
	return $n($n($n(styled($ag(view("section"), "id", "install", $ap, $aq), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "One command, the whole toolchain"), $ap, $aq), $n($n($n(styled(view("p"), lead), pt("The compiler, dev server with hot reload, formatter, test runner, and language server live in one small binary. There is nothing else to install and nothing to configure. Update any time with "), $ap, $aq), leaf("vilan upgrade"), $ap, $aq), pt("."), $ap, $aq), $ap, $aq), $n($n(styled(view("div"), install_split), $n($n($n(styled(view("div"), install_grid), install_row("macOS / Linux", "curl -fsSL https://github.com/vilan-lang/vilan/releases/latest/download/install.sh | sh", copy, $ap, $aq, $ar), $ap, $aq), install_row("Windows (PowerShell)", "irm https://github.com/vilan-lang/vilan/releases/latest/download/install.ps1 | iex", copy, $ap, $aq, $ar), $ap, $aq), install_row("Homebrew", "brew install vilan-lang/vilan/vilan", copy, $ap, $aq, $ar), $ap, $aq), $ap, $aq), $n(styled(view("div"), install_art_cell), toolchain_art($ap, $aq), $ap, $aq), $ap, $aq), $ap, $aq);
}
function showcase(prose, code, $cX, $cY) {
	return $n($n(styled(view("div"), showcase_grid), __clone(prose), $cX, $cY), __clone(code), $cX, $cY);
}
function showcase_flipped(code, prose, $ds, $dt) {
	return $n($n(styled(view("div"), showcase_grid_flipped), __clone(code), $ds, $dt), __clone(prose), $ds, $dt);
}
function counter_demo($bf, $bg) {
	const count = $bh(0);
	return $n($n(styled(view("div"), demo_box), on(text(styled(view("button"), demo_button), "+1"), "click", ($bj, $bk) => {
		return $bl(count, (n) => {
			return n + 1;
		}, [ 0, $bj ]);
	}), $bf, $bg), $by(styled(view("p"), demo_label), $bx(__clone(count), (n, $bu, $bv, $bw) => {
		return "clicked " + n + " times";
	}), $bf, $bg), $bf, $bg);
}
function showcase_reactive($bd, $be) {
	return $n($n(styled(view("section"), add(add(column, section_block), stack)), showcase($n($n($n($n(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "UI that follows your data"), $bd, $be), $n($n($n(styled(view("p"), lead), pt("A view is a value and a binding is a subscription: "), $bd, $be), leaf("bind_text"), $bd, $be), pt(" sets the text node once, then sets it again whenever the signal changes. There is no virtual DOM, no render loop, and no dependency array to babysit. Updates land exactly where the data changed."), $bd, $be), $bd, $be), text(styled(view("p"), lead), "The snippet is the whole program, and it runs. Try it right here:"), $bd, $be), counter_demo($bd, $be), $bd, $be), code_panel([ ln([ kw("import"), t(" std::ui::{ view, mount_root };") ]), ln([ kw("import"), t(" std::reactive::"), ty("Signal"), t(";") ]), blank(), ln([ kw("fun"), t(" "), fn("main"), t("() {") ]), ln([ t("    "), kw("let"), t(" count = "), ty("Signal"), t("::"), fn("new"), t("("), st("0"), t(");") ]), ln([ t("    "), kw("let"), t(" _root = "), fn("mount_root"), t("("), st("\"app\""), t(", || {") ]), ln([ t("        "), fn("view"), t("("), st("\"div\""), t(")") ]), ln([ t("            ."), fn("child"), t("("), fn("view"), t("("), st("\"p\""), t(")."), fn("bind_text"), t("(count."), fn("derive"), t("(|n: i32| "), st("i\"clicked "), hl("{"), t("n"), hl("}"), st(" times\""), t(")))") ]), ln([ t("            ."), fn("child"), t("("), fn("view"), t("("), st("\"button\""), t(")."), fn("text"), t("("), st("\"+1\""), t(")."), fn("on"), t("("), st("\"click\""), t(", || count."), fn("set_with"), t("(|n| n + "), st("1"), t(")))") ]), ln([ t("    });") ]), ln([ t("}") ]) ]), $bd, $be), $bd, $be), dataflow_art($bd, $be), $bd, $be);
}
function showcase_fullstack($dh, $di) {
	return $n($n($n($n(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "The server is a struct. The client is generated."), $dh, $di), $n($n($n($n($n(styled(view("p"), lead), pt("Mark a method "), $dh, $di), leaf_link("/docs/guide/services.html#what-rpc-calls-do", "[rpc]", $dh, $di), $dh, $di), pt(" and the browser can call it like any other function, typed and checked. Mark a signal "), $dh, $di), leaf_link("/docs/guide/services.html#mirrors", "[expose]", $dh, $di), $dh, $di), pt(" and every connected client holds a live mirror that updates when the server writes. You never write REST endpoints, fetch calls, or the JSON shapes that drift out of sync between them."), $dh, $di), $dh, $di), diagram($dh, $di), $dh, $di), button_link("/docs/guide/services.html", "Services & RPC in the guide", $dh, $di), $dh, $di);
}
function showcase_compiler($dq, $dr) {
	return $n(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped($n($n(styled(view("div"), diag_stack), code_panel([ ln([ kw("import"), t(" std::io::print;") ]), ln([ kw("import"), t(" std::option::"), ty("Option"), t("::{ self, "), ty("Some"), t(", "), ty("None"), t(" };") ]), ln([ kw("fun"), t(" "), fn("find_user"), t("(id: i32): "), ty("Option"), t("<str> {") ]), ln([ t("    "), kw("if"), t(" id == "), st("1"), t(" { "), ty("Some"), t("("), st("\"Ada\""), t(") } "), kw("else"), t(" { "), ty("None"), t(" }") ]), ln([ t("}") ]), ln([ kw("fun"), t(" "), fn("greet"), t("(name: str): str {") ]), ln([ t("    "), st("i\"hello "), hl("{"), t("name"), hl("}"), st("\"") ]), ln([ t("}") ]), ln([ kw("fun"), t(" "), fn("main"), t("() {") ]), ln([ t("    "), fn("print"), t("("), fn("greet"), t("("), fn("find_user"), t("("), st("2"), t(")));") ]), ln([ t("}") ]) ]), $dq, $dr), $n($n($n($n($n($n($n(styled(view("pre"), diag_pre), ln([ text(styled(view("span"), diag_error), "Error:"), t(" Expected str, but got Option<str> instead.") ]), $dq, $dr), ln([ text(styled(view("span"), diag_frame), "    \u{256d}\u{2500}[ demo.vl:10:14 ]") ]), $dq, $dr), ln([ text(styled(view("span"), diag_frame), "    \u{2502}") ]), $dq, $dr), ln([ text(styled(view("span"), diag_frame), " 10 \u{2502}     print(greet(find_user(2)));") ]), $dq, $dr), ln([ text(styled(view("span"), diag_frame), "    \u{2502}                 \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{252c}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}") ]), $dq, $dr), ln([ text(styled(view("span"), diag_frame), "    \u{2502}                       \u{2570}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500} Expected str, but got Option<str> instead.") ]), $dq, $dr), ln([ text(styled(view("span"), diag_frame), "\u{2500}\u{2500}\u{2500}\u{2500}\u{256f}") ]), $dq, $dr), $dq, $dr), $n($n($n($n(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "Find out at compile time"), $dq, $dr), $n($n($n($n($n(styled(view("p"), lead), pt("Vilan has no null and no exceptions. A value that might be missing is an "), $dq, $dr), leaf_link("/docs/std/option-result.html#optiont", "Option", $dq, $dr), $dq, $dr), pt(", a call that might fail returns a "), $dq, $dr), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $dq, $dr), $dq, $dr), pt(", and the compiler makes you look inside before you use either. The mistake in this snippet is a build error, not a production incident."), $dq, $dr), $dq, $dr), text(styled(view("p"), lead), "Values are copied rather than silently shared, so two names never fight over one object. Most of the mistakes JavaScript saves for runtime cannot even be written."), $dq, $dr), button_link("/docs/std/option-result.html", "Option & Result in the reference", $dq, $dr), $dq, $dr), $dq, $dr), $dq, $dr);
}
function editor_band($du, $dv) {
	return $n(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped(editor_art($du, $dv), $n($n($n($n(styled(view("div"), showcase_copy), text(styled(view("h2"), heading), "The editor is in on it"), $du, $dv), $n($n($n($n(styled(view("p"), lead), leaf("vilan"), $du, $dv), pt(" and "), $du, $dv), leaf("vilan-lsp"), $du, $dv), pt(" ship together so your editor and build never disagree. In-editor diagnostics, hover types and docs, autocompletion, Symbol Rename, formatting, and Organize Imports are all available in VS Code today."), $du, $dv), $du, $dv), text(styled(view("p"), lead), "One broken line does not take the tooling down. The rest of the file keeps compiling, serving hovers, and completing while you fix it."), $du, $dv), button_link("https://github.com/vilan-lang/vilan/tree/main/editors/vscode", "The VS Code extension", $du, $dv), $du, $dv), $du, $dv), $du, $dv);
}
function button_link(href, label, $do, $dp) {
	return $n($n($ag(styled(view("a"), button_link_style), "href", href, $do, $dp), pt(label), $do, $dp), $ag($ag(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $do, $dp), "alt", "", $do, $dp), $do, $dp);
}
function docs_link(href, label, $dC, $dD) {
	return $n($n($ag(styled(view("a"), card_link), "href", href, $dC, $dD), pt(label), $dC, $dD), $ag($ag(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $dC, $dD), "alt", "", $dC, $dD), $dC, $dD);
}
function feature(icon, name, href, body, $dA, $dB) {
	return $n($n($n($n(styled(view("article"), card), $ag($ag(styled(view("img"), card_icon), "src", "" + assets + "/icons/" + icon + ".svg", $dA, $dB), "alt", "", $dA, $dB), $dA, $dB), text(styled(view("h3"), card_title), name), $dA, $dB), children(styled(view("p"), card_body), body), $dA, $dB), docs_link(href, "docs", $dA, $dB), $dA, $dB);
}
function feature_grid($dy, $dz) {
	return $n($n(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("h2"), heading), "Built into the language"), $dy, $dz), $n($n($n($n($n($n($ag(styled(view("div"), cards_grid), "data-glow", "", $dy, $dz), feature("shield-check", "No null, no exceptions", "/docs/std/option-result.html", [ pt("A missing value is an "), leaf_link("/docs/std/option-result.html#optiont", "Option", $dy, $dz), pt(", a failure is a "), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $dy, $dz), pt(", and "), leaf("match"), pt(" makes you handle both arms. Errors are ordinary values you pass around like any other data.") ], $dy, $dz), $dy, $dz), feature("copy", "Values, not references", "/docs/tour/memory-model.html", [ pt("Assignment copies. Sharing is explicit, borrowing is checked, and spooky action at a distance is a compile error.") ], $dy, $dz), $dy, $dz), feature("zap", "Async without the ceremony", "/docs/tour/async.html", [ leaf_link("/docs/tour/async.html#opting-out-of-waiting-async-and-await", "await", $dy, $dz), pt(" is implicit. Call an async function and the machinery is the compiler\'s problem. When you want real concurrency, tasks and "), leaf_link("/docs/tour/async.html#nurseries-structured-spawning", "nurseries", $dy, $dz), pt(" give it structure.") ], $dy, $dz), $dy, $dz), feature("layers", "One program, two platforms", "/docs/tour/platforms.html", [ pt("One workspace compiles the node server and the browser client. The compiler tracks which code needs which platform and keeps each bundle honest.") ], $dy, $dz), $dy, $dz), feature("server", "Rendered before it ships", "/docs/guide/ssr.html", [ leaf("std::ui"), pt(" renders on the server too: first paint is real markup, then the client rebuilds it live. View source on this page and the content is already there.") ], $dy, $dz), $dy, $dz), feature("refresh-cw", "A dev loop that keeps up", "/docs/guide/dev-loop.html", [ leaf("vilan run . --watch"), pt(" rebuilds in milliseconds and hot-reloads the browser. Format, test, and language server ship in the same binary.") ], $dy, $dz), $dy, $dz), $dy, $dz);
}
function dogfood($dE, $dF) {
	return $n($n($n(styled(view("section"), add(add(column, section_block), stack)), text(styled(view("p"), dogfood_text), "This site is a vilan program: one package, three entries \u{2014} this page, the playground, and the server that renders both. The server rendered the markup you first saw, and the browser rebuilt it live."), $dE, $dF), text(styled(view("p"), dogfood_text), "Vilan is built to last. Semantics are settled on paper before they are implemented, and pinned by tests after. A language is a foundation, and a foundation should not move under you."), $dE, $dF), $n(styled(view("p"), dogfood_cta), docs_link("https://github.com/vilan-lang/website", "Read this page\'s source", $dE, $dF), $dE, $dF), $dE, $dF);
}
function footer_column(title, links, $dI, $dJ) {
	return $n($n(view("div"), text(styled(view("p"), footer_head), title), $dI, $dJ), children(styled(view("div"), footer_list), links), $dI, $dJ);
}
function page_footer($dG, $dH) {
	return $n($n(styled(view("footer"), footer_block), $n($n($n($n(styled(view("div"), add(column, footer_grid)), styled($ag($ag($ag(view("img"), "src", "" + assets + "/footer_mark.webp", $dG, $dH), "alt", "The vilan mark", $dG, $dH), "width", "200", $dG, $dH), footer_mark), $dG, $dH), footer_column("Using Vilan", [ text($ag(styled(view("a"), footer_link), "href", "#install", $dG, $dH), "Install"), text($ag(styled(view("a"), footer_link), "href", "/docs/tour/hello-vilan.html", $dG, $dH), "Learn"), text($ag(styled(view("a"), footer_link), "href", "/playground", $dG, $dH), "Playground"), text($ag(styled(view("a"), footer_link), "href", "/docs/", $dG, $dH), "Documentation") ], $dG, $dH), $dG, $dH), footer_column("Community", [ text($ag(styled(view("a"), footer_link), "href", "" + repo + "/issues", $dG, $dH), "Issues"), text($ag(styled(view("a"), footer_link), "href", "" + repo + "/discussions", $dG, $dH), "Discussions"), text($ag(styled(view("a"), footer_link), "href", "https://github.com/vilan-lang", $dG, $dH), "GitHub") ], $dG, $dH), $dG, $dH), footer_column("Terms & policies", [ text($ag(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/CODE_OF_CONDUCT.md", $dG, $dH), "Code of Conduct"), text($ag(styled(view("a"), footer_link), "href", "" + repo + "#license", $dG, $dH), "Licenses"), text($ag(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/assets/branding/LICENSE", $dG, $dH), "Logo Policy") ], $dG, $dH), $dG, $dH), $dG, $dH), $n(styled(view("div"), column), $n($n(styled(view("div"), footer_micro), text(view("span"), "\u{a9} 2026 Reed Syllas"), $dG, $dH), text(view("span"), "MIT or Apache-2.0"), $dG, $dH), $dG, $dH), $dG, $dH);
}
function diagram($dl, $dm) {
	return $n($n($n($n($n($n($n($n(styled(view("div"), art_stage), styled(view("div"), dg_blob_top), $dl, $dm), styled(view("div"), dg_blob_left), $dl, $dm), styled(view("div"), dg_blob_right), $dl, $dm), grain(), $dl, $dm), $n($n(styled(view("div"), dg_source), $dn(styled(view("p"), art_tab), "notes.vl \u{b7} one source", $dl, $dm), $dl, $dm), $n($n($n($n($n($n($n($n($n(styled(view("div"), art_code), ln([ t("["), kw("service"), t("(NotesClient)]") ]), $dl, $dm), ln([ kw("struct"), t(" Notes {") ]), $dl, $dm), ln([ t("    ["), kw("expose"), t("] entries: SignalCell<List<Note>>,") ]), $dl, $dm), ln([ t("}") ]), $dl, $dm), blank(), $dl, $dm), ln([ kw("impl"), t(" Notes {") ]), $dl, $dm), ln([ t("    ["), kw("rpc"), t("]") ]), $dl, $dm), ln([ t("    "), kw("fun"), t(" add(self, text: str): i32 { \u{2026} }") ]), $dl, $dm), ln([ t("}") ]), $dl, $dm), $dl, $dm), $dl, $dm), $n($n($n($n(styled(view("div"), dg_wire_zone), styled(view("div"), dg_wire_left), $dl, $dm), styled(view("div"), dg_wire_right), $dl, $dm), $dn(styled(view("span"), dg_wire_label_left), "vilan build", $dl, $dm), $dl, $dm), $dn(styled(view("span"), dg_wire_label_right), "vilan build", $dl, $dm), $dl, $dm), $dl, $dm), $n($n($n(styled(view("div"), dg_legs), $n($n(styled(view("div"), art_card), $n($n($n(styled(view("div"), dg_leg_head), styled(view("div"), dot_magenta), $dl, $dm), $dn(styled(view("span"), dg_leg_name), "the server", $dl, $dm), $dl, $dm), $dn(styled(view("span"), dg_leg_env), "node", $dl, $dm), $dl, $dm), $dl, $dm), $n($n(styled(view("div"), art_code), ln([ t("serve_service(4000,") ]), $dl, $dm), ln([ t("    notes.dispatcher() \u{2026})") ]), $dl, $dm), $dl, $dm), $dl, $dm), $n($n(styled(view("div"), dg_mid), $n($n(view("div"), $dn(styled(view("p"), dg_mid_label), "notes.add(\"ship it\")", $dl, $dm), $dl, $dm), $n($n(styled(view("div"), dg_line_row), styled(view("div"), arrow_head_left), $dl, $dm), styled(view("div"), dg_line), $dl, $dm), $dl, $dm), $dl, $dm), $n($n($n(view("div"), $n($n(styled(view("div"), dg_line_row), styled(view("div"), dg_line_dashed), $dl, $dm), styled(view("div"), arrow_head_right_rose), $dl, $dm), $dl, $dm), $dn(styled(view("p"), dg_mid_label_rose), "entries", $dl, $dm), $dl, $dm), $dn(styled(view("p"), dg_note), "mirrored live", $dl, $dm), $dl, $dm), $dl, $dm), $dl, $dm), $n($n(styled(view("div"), art_card), $n($n($n(styled(view("div"), dg_leg_head), styled(view("div"), dot_orange), $dl, $dm), $dn(styled(view("span"), dg_leg_name), "the client", $dl, $dm), $dl, $dm), $dn(styled(view("span"), dg_leg_env), "browser", $dl, $dm), $dl, $dm), $dl, $dm), $n($n(styled(view("div"), art_code), ln([ kw("let"), t(" notes = NotesClient::connect("), st("\"/rpc\""), t(");") ]), $dl, $dm), ln([ t("notes.entries "), t("// Signal, live") ]), $dl, $dm), $dl, $dm), $dl, $dm), $dl, $dm), $dn(styled(view("p"), art_caption), "one definition: the compiler builds both sides and keeps them honest", $dl, $dm), $dl, $dm);
}
function editor_art($dw, $dx) {
	return $n($n($n($n(styled(view("div"), art_stage), styled(view("div"), ed_blob_a), $dw, $dx), styled(view("div"), ed_blob_b), $dw, $dx), grain(), $dw, $dx), $n($n($n($n(styled(view("div"), ed_window), $n($n($n($n(styled(view("div"), ed_titlebar), styled(view("div"), ed_dot_red), $dw, $dx), styled(view("div"), ed_dot_orange), $dw, $dx), styled(view("div"), ed_dot_magenta), $dw, $dx), text(styled(view("span"), ed_title), "app.vl \u{2014} vilan"), $dw, $dx), $dw, $dx), $n($n(styled(view("div"), ed_body), text(styled(view("div"), ed_gutter), "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"), $dw, $dx), $n($n($n($n($n($n($n($n($n($n($n(styled(view("div"), ed_code), ln([ kw("import"), t(" std::io::print;") ]), $dw, $dx), ln([ kw("import"), t(" std::option::Option::{ self, Some, None };") ]), $dw, $dx), ln([ kw("fun"), t(" find_user(id: i32): Option<str> {") ]), $dw, $dx), ln([ t("    "), kw("if"), t(" id == 1 { Some("), st("\"Ada\""), t(") } "), kw("else"), t(" { None }") ]), $dw, $dx), ln([ t("}") ]), $dw, $dx), ln([ kw("fun"), t(" greet(name: str): str {") ]), $dw, $dx), ln([ t("    "), st("i\"hello {name}\"") ]), $dw, $dx), ln([ t("}") ]), $dw, $dx), ln([ kw("fun"), t(" main() {") ]), $dw, $dx), ln([ t("    print(greet("), text(styled(view("span"), ed_squiggle), "find_user(2)"), t("));"), styled(view("span"), ed_caret) ]), $dw, $dx), ln([ t("}") ]), $dw, $dx), $dw, $dx), $dw, $dx), $n($n($n(styled(view("div"), ed_statusbar), text(styled(view("span"), ed_problem), "\u{2297} 1"), $dw, $dx), text(view("span"), "vilan-lsp"), $dw, $dx), text(styled(view("span"), ed_status_right), "Ln 10, Col 17 \u{b7} app.vl"), $dw, $dx), $dw, $dx), $n($n(styled(view("div"), ed_hover), text(styled(view("div"), ed_hover_error), "Expected str, but got Option<str> instead."), $dw, $dx), text(styled(view("div"), ed_hover_from), "vilan \u{b7} live as you type"), $dw, $dx), $dw, $dx), $dw, $dx);
}
function tc_chip_at(left, top, color, label, $bb, $bc) {
	return $n($n($ag(styled(view("div"), tc_chip), "style", "left: " + left + "; top: " + top, $bb, $bc), $ag(styled(view("div"), led), "style", "background: " + color, $bb, $bc), $bb, $bc), text(view("span"), label), $bb, $bc);
}
function toolchain_art($aZ, $ba) {
	return $n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n($n(styled(view("div"), tc_wrap), styled(view("div"), tc_blob_b), $aZ, $ba), styled(view("div"), tc_blob_a), $aZ, $ba), styled(view("div"), tc_blob_c), $aZ, $ba), grain(), $aZ, $ba), styled(view("div"), tc_spoke_up), $aZ, $ba), styled(view("div"), tc_spoke_down), $aZ, $ba), styled(view("div"), tc_spoke_run), $aZ, $ba), styled(view("div"), tc_spoke_fmt), $aZ, $ba), styled(view("div"), tc_spoke_lsp), $aZ, $ba), styled(view("div"), tc_spoke_upgrade), $aZ, $ba), styled(view("div"), tc_center_mask), $aZ, $ba), $ag($ag(styled(view("div"), tc_center), "role", "img", $aZ, $ba), "aria-label", "vilan", $aZ, $ba), $aZ, $ba), tc_chip_at("210px", "70px", primary[0], "vilan build", $aZ, $ba), $aZ, $ba), tc_chip_at("328px", "142px", "#D84730", "vilan run --watch", $aZ, $ba), $aZ, $ba), tc_chip_at("344px", "288px", accent[0], "vilan fmt", $aZ, $ba), $aZ, $ba), tc_chip_at("210px", "360px", "#B23056", "vilan test", $aZ, $ba), $aZ, $ba), tc_chip_at("78px", "288px", "#8B2786", "vilan-lsp", $aZ, $ba), $aZ, $ba), tc_chip_at("82px", "142px", "#672283", "vilan upgrade", $aZ, $ba), $aZ, $ba);
}
function df_arrow_to(label, $df, $dg) {
	return $n($n(styled(view("div"), df_arrow), text(styled(view("span"), df_arrow_label), label), $df, $dg), $n($n(styled(view("div"), df_arrow_row), styled(view("div"), dg_line), $df, $dg), styled(view("div"), arrow_head_right), $df, $dg), $df, $dg);
}
function df_node_view(lit, tag, body, $db, $dc) {
	const $de = view("div");
	let $dd = null;
	if (lit) {
		$dd = df_node_lit;
	} else {
		$dd = df_node;
	}
	return $n($n(styled($de, $dd), text(styled(view("p"), df_tag), tag), $db, $dc), $n(styled(view("div"), art_code), ln(body), $db, $dc), $db, $dc);
}
function dataflow_art($cZ, $da) {
	return $n($n($n($n($n(styled(view("div"), df_wrap), styled(view("div"), df_blob_a), $cZ, $da), styled(view("div"), df_blob_b), $cZ, $da), grain(), $cZ, $da), $n($n($n($n($n(styled(view("div"), df_row), df_node_view(false, "the write", [ t("count.set("), st("2"), t(")") ], $cZ, $da), $cZ, $da), df_arrow_to("notify", $cZ, $da), $cZ, $da), df_node_view(false, "the signal", [ t("SignalCell<i32> "), kw("= 2") ], $cZ, $da), $cZ, $da), df_arrow_to("re-set", $cZ, $da), $cZ, $da), df_node_view(true, "the one text node", [ t("<p>clicked "), kw("2"), t(" times</p>") ], $cZ, $da), $cZ, $da), $cZ, $da), text(styled(view("p"), art_caption), "no virtual DOM, no re-render: the subscription updates exactly one node"), $cZ, $da);
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
function leaf_link(href, text2, $dj, $dk) {
	return text($ag(styled(view("a"), leaf_link_style), "href", href, $dj, $dk), text2);
}
function pt(text2) {
	return text(view("span"), text2);
}
function bloom($l, $m) {
	return $n(styled(view("div"), bloom_field), $n($n(styled(view("div"), bloom_drift), $n(styled(view("div"), bloom_blurwrap), styled(view("div"), bloom_gradient), $l, $m), $l, $m), styled(view("div"), bloom_duo), $l, $m), $l, $m);
}
function hero($al, $am) {
	return $n($n($n($n(styled(view("header"), hero_block), text(styled(view("h1"), visually_hidden), "Vilan \u{2014} The Modern Web Language"), $al, $am), $ag($ag(styled(view("img"), hero_mark), "src", "" + assets + "/dark_logo_flat.svg", $al, $am), "alt", "", $al, $am), $al, $am), $ag($ag(styled(view("img"), hero_wordmark), "src", "" + assets + "/wordmark_hero.svg", $al, $am), "alt", "VILAN", $al, $am), $al, $am), text($ag(styled(view("p"), hero_tagline), "aria-hidden", "true", $al, $am), "The Modern Web Language"), $al, $am);
}
function masthead($aj, $ak) {
	return $n(styled(view("div"), masthead_wrap), hero($aj, $ak), $aj, $ak);
}
function divider($an, $ao) {
	return $n(styled(view("div"), column), styled(view("div"), rule_line), $an, $ao);
}
function grain() {
	return styled(view("div"), grain_overlay);
}
function top_bar(scroll_fade2, $q, $r) {
	return $n($s(styled(view("nav"), topbar), "--nav-fade", __clone(scroll_fade2), $q, $r), $n($n(styled(view("div"), add(column, nav_row)), $n($n($ag(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $q, $r), $ag(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $q, $r), $q, $r), text(view("span"), "VILAN"), $q, $r), $q, $r), $n($n($n($n(styled(view("div"), nav_links), text($ag(styled(view("a"), nav_link), "href", "/#install", $q, $r), "Install"), $q, $r), text($ag(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html", $q, $r), "Learn"), $q, $r), text($ag(styled(view("a"), nav_link), "href", "/playground/", $q, $r), "Playground"), $q, $r), text($ag(styled(view("a"), nav_link), "href", "/docs/", $q, $r), "Docs"), $q, $r), $q, $r), $q, $r);
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
	place(content, self, $o, $p);
	return __clone(self);
}
function $F(signal, subscriber) {
	const handle = [ signal[1], subscriber[0], subscriber[2], __shared_new([ 1 ]) ];
	signal[1].v.push(reissued(subscriber));
	return handle;
}
function $C(signal, observer) {
	const cell = signal[0];
	return $F(signal, mint_subscriber(() => {
		const $D = [ 0, cell ];
		let $E = null;
		if ($D[0] === 0) {
			const live = $D[1];
			$E = observer(live.v);
		} else {
			$E = undefined;
		}
		return $E;
	}));
}
function $G(self) {
	return __clone(self[0].v);
}
function $B(self, observer, immediately) {
	const subscription = $C(self, observer);
	if (immediately) {
		observer($G(self));
	}
	return subscription;
}
function $A(self, observer) {
	return $B(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $N(self) {
	return self.length === 0;
}
function $M(self) {
	let $O = null;
	if ($N(self)) {
		$O = [ 1 ];
	} else {
		$O = __list_get(self, self.length - 1);
	}
	return $O;
}
function $H(self, item, $I) {
	defer(self, () => {
		dispose(item, $I);
		return;
	});
	return __clone(item);
}
function $w(flow, observer, $x, $y) {
	$H(get_owner($y), $A(flow, observer), $x);
}
function $s(self, name, source, $t, $u) {
	const element = __clone(self[0]);
	$w(source, (value, $v) => {
		element.style.setProperty(name, value);
		return;
	}, $t, $u);
	return __clone(self);
}
function $W(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[0]));
	}
	return result;
}
function $X(self, key) {
	const $Y = __map_get(self[0], hash(key));
	let $Z = null;
	if ($Y[0] === 0) {
		const entry = $Y[1];
		$Z = [ 0, __clone(entry.slice(1, 3)) ];
	} else {
		$Z = [ 1 ];
	}
	return $Z;
}
function $ae(self, key) {
	self[0].delete(hash(key));
}
function $af(self, key, value) {
	self[0].set(hash(key), [ __clone(key), ...__clone(value) ]);
}
function $ag(self, name, value, $ah, $ai) {
	apply(value, self, name, $ah, $ai);
	return __clone(self);
}
function $az(self, $aA) {
	const $aB = $aA;
	let $aC = null;
	if ($aB[0] === 0) {
		const turn = $aB[1];
		$aC = enqueue(turn, __clone(self[1].v));
	} else {
		const $aF = $M(draining_turns.v);
		let $aG = null;
		if ($aF[0] === 0) {
			const draining = $aF[1];
			$aG = enqueue(draining, __clone(self[1].v));
		} else {
			for (const subscriber of __clone(self[1].v)) {
				if (subscriber[2].v) {
					subscriber[1]();
				}
			}
			$aG = undefined;
		}
		$aC = $aG;
	}
	return $aC;
}
function $ax(self, value, $ay) {
	self[0].v = __clone(value);
	$az(self, $ay);
}
function $aO(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[5].v = true;
	return result;
}
function $aV(flow, parent, name, $aW, $aX) {
	const element = __clone(parent[0]);
	$w(flow, (value, $aY) => {
		element.setAttribute(name, value);
		return;
	}, $aW, $aX);
}
function $aS(self, parent, name, $aT, $aU) {
	$aV(self, parent, name, $aT, $aU);
}
function $aP(self, name, source, $aQ, $aR) {
	$aS(source, self, name, $aQ, $aR);
	return __clone(self);
}
function $bh(value) {
	return $b(value);
}
function $bo(self, value, $ay) {
	self[0].v = __clone(value);
	$az(self, $ay);
}
function $bl(self, transform, $bm) {
	$bo(self, transform($G(self)), $bm);
}
function $bx(self, transform) {
	return [ self, transform ];
}
function $bH(self, subscriber) {
	return $F(self, subscriber);
}
function $bG(self) {
	return [ () => {
		return $G(self);
	}, (subscriber) => {
		return $bH(self, subscriber);
	}, () => {
		return;
	} ];
}
function $cd(self) {
	const $ce = self;
	return $ce[0] === 1;
}
function $bX(runs, body) {
	const run = renew(runs);
	const $co = nursery(run);
	let $cp = null;
	if ($co[0] === 0) {
		const nursery2 = $co[1];
		$cp = (($cq) => {
			return (($cr) => {
				return body($cq, $cr);
			})(nursery2);
		})(run);
	} else {
		$cp = (() => {
			throw "a renewed run carries its nursery";
		})();
	}
	return $cp;
}
function $cH(self) {
	let $cJ = null;
	if ($N(self)) {
		$cJ = [ 1 ];
	} else {
		$cJ = __list_get(self, self.length - 1);
	}
	return $cJ;
}
function $bQ(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = $bX(runs, ($bU, $bV) => {
		return (($bW) => {
			return body($bU, $bW, $bV);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function $bM(runs, tracker, body) {
	let value = $bQ(runs, tracker, ($bN, $bO, $bP) => {
		return body($bN, $bO, $bP);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = $bQ(runs, tracker, ($cM, $cN, $cO) => {
			return body($cM, $cN, $cO);
		});
		rounds = rounds + 1;
	}
	if (tracker[0].v[4]) {
		tracker[0].v[4] = false;
	}
	return value;
}
function $bF(self) {
	const transform = self[1];
	const upstream = $bG(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return $bM(runs, tracker, ($bJ, $bK, $bL) => {
			return transform(value, $bJ, $bK, $bL);
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
function $bE(flow, observer, immediately) {
	const instance = $bF(flow);
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
function $bD(self, observer) {
	return $bE(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $bC(flow, observer, $x, $y) {
	$H(get_owner($y), $bD(flow, observer), $x);
}
function $by(self, source, $bz, $bA) {
	const element = __clone(self[0]);
	$bC(source, (value, $bB) => {
		element.textContent = value;
		return;
	}, $bz, $bA);
	return __clone(self);
}
function $dn(self, content, $o, $p) {
	place2(content, self, $o, $p);
	return __clone(self);
}
function $dL(body) {
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
const run_nurseries_allocated_count = __shared_new(0);
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
let $dO = null;
if (!(reduced_motion)) {
	for (const target of targets) {
		if (target.getBoundingClientRect().top > viewport - 40.0) {
			target.style.setProperty("opacity", "0");
			target.style.setProperty("transform", "translateY(28px)");
		}
	}
	$dO = undefined;
}
$dO;
const publish = () => {
	return $aO([ 1 ], ($dP) => {
		const progress = Math.max(Math.min(probe.scrollTop / 64.0, 1.0), 0.0);
		$ax(scroll_fade, "" + progress, [ 0, $dP ]);
		let $dQ = null;
		if (!(reduced_motion)) {
			const line = probe.clientHeight * 0.92;
			for (const target2 of targets) {
				if (target2.getBoundingClientRect().top < line) {
					target2.style.setProperty("transition", "opacity 600ms ease, transform 600ms ease");
					target2.style.setProperty("opacity", "1");
					target2.style.setProperty("transform", "none");
				}
			}
			$dQ = undefined;
		}
		return $dQ;
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
