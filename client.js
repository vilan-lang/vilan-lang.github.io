function __at(list, index, location) {
	if (index >= 0 && index < list.length) return list[index];
	throw __panic("index out of bounds: the length is " + list.length + " but the index is " + index, location);
}
function __at_put(list, index, value, location) {
	if (index >= 0 && index < list.length) return list[index] = value;
	throw __panic("index out of bounds: the length is " + list.length + " but the index is " + index, location);
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
function __insert_at(list, index, value, location) {
	if (index >= 0 && index < list.length) return void list.splice(index, 0, value);
	if (index === list.length) return void list.push(value);
	throw __panic("index out of bounds: the length is " + list.length + " but the index is " + index, location);
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
	const failure = winner.error;
	if (typeof failure === "string") throw failure + " (in task spawned in " + winner.origin + ")";
	if (failure && failure.location !== undefined) throw __panic(failure.message + " (in task spawned in " + winner.origin + ")", failure.location);
	throw failure;
}
function __panic(message, location) {
	const error = new Error(message);
	error.name = "panicked at " + location;
	Object.defineProperty(error, "location", { value: location });
	if (Error.captureStackTrace) Error.captureStackTrace(error, __panic);
	return error;
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
function mint_subscriber(notify2) {
	const derived = minting_derivation.v;
	minting_derivation.v = false;
	return subscriber_of(notify2, derived);
}
function subscriber_of(notify2, derived) {
	return [ fresh_id(), notify2, __shared_new(true), derived ];
}
function new2() {
	return [ __shared_new([  ]), __shared_new([  ]), __shared_new(new Map()), __shared_new(new Map()), __shared_new(false), __shared_new(false), __shared_new(false) ];
}
function is_quiescent(self) {
	return is_empty(self[0].v) && is_empty(self[1].v);
}
function enqueue(turn2, subscribers) {
	for (const subscriber of subscribers) {
		const key = hash2(subscriber[0]);
		let $am = null;
		if (subscriber[3]) {
			if (!(turn2[3].v.has(key))) {
				turn2[3].v.set(key, true);
				turn2[1].v.push(__clone(subscriber));
			}
			$am = undefined;
		} else if (!(turn2[2].v.has(key))) {
			turn2[2].v.set(key, true);
			let index = turn2[0].v.length;
			while (index > 0 && __at(turn2[0].v, index - 1, "std/src/reactive.vl:414:21")[0] > subscriber[0]) {
				index = index - 1;
			}
			__insert_at(turn2[0].v, index, __clone(subscriber), "std/src/reactive.vl:417:25");
		}
		$am;
	}
	if (turn2[5].v && !(turn2[6].v) && !(turn2[4].v)) {
		turn2[6].v = true;
		queueMicrotask(() => {
			turn2[6].v = false;
			drain(turn2);
			return;
		});
	}
}
function drain(turn2) {
	if (!(turn2[4].v)) {
		turn2[4].v = true;
		draining_turns.v.push(__clone(turn2));
		__with_finally(() => {
			let budget = 100000;
			while (!(is_quiescent(turn2)) && budget > 0) {
				while (!(is_empty(turn2[1].v)) && budget > 0) {
					const derivations = turn2[1].v;
					turn2[1].v = [  ];
					turn2[3].v = new Map();
					for (const subscriber of derivations) {
						if (subscriber[2].v) {
							subscriber[1]();
						}
						budget = budget - 1;
					}
				}
				const wave = turn2[0].v;
				turn2[0].v = [  ];
				turn2[2].v = new Map();
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
			turn2[4].v = false;
			return;
		});
	}
}
function defer_subscriber(turn2, subscriber) {
	const $bO = turn2;
	let $bP = null;
	if ($bO[0] === 0) {
		const ambient = $bO[1];
		$bP = enqueue(ambient, [ reissued(subscriber) ]);
	} else {
		const $bQ = last(draining_turns.v);
		let $bR = null;
		if ($bQ[0] === 0) {
			const draining = $bQ[1];
			$bR = enqueue(draining, [ reissued(subscriber) ]);
		} else {
			if (subscriber[2].v) {
				subscriber[1]();
			}
			$bR = undefined;
		}
		$bP = $bR;
	}
	return $bP;
}
function reissued(subscriber) {
	return [ subscriber[0], subscriber[1], subscriber[2], subscriber[3] ];
}
function wake(subscriber) {
	defer_subscriber([ 1 ], subscriber);
}
function dispose(self, $x) {
	const $y = $x;
	let $z = null;
	if ($y[0] === 0) {
		const established = $y[1];
		$z = [ 0, established ];
	} else {
		$z = last(draining_turns.v);
	}
	const ambient = $z;
	release_under(self, ambient);
}
function detach(handle) {
	const $bT = last2(releasing_turns.v);
	let $bU = null;
	if ($bT[0] === 0) {
		const at_release = $bT[1];
		$bU = at_release;
	} else {
		$bU = last(draining_turns.v);
	}
	const turn2 = $bU;
	release_under(handle, turn2);
}
function release_under(handle, ambient) {
	handle[2].v = false;
	const $B = [ 0, handle[0] ];
	let $C = null;
	if ($B[0] === 0) {
		const subscribers = $B[1];
		let kept = [  ];
		for (const subscriber of subscribers.v) {
			if (subscriber[0] !== handle[1]) {
				kept.push(__clone(subscriber));
			}
		}
		subscribers.v = kept;
		$C = undefined;
	} else {
		$C = undefined;
	}
	$C;
	const $D = ambient;
	let $E = null;
	if ($D[0] === 0) {
		const turn2 = $D[1];
		let kept_pending = [  ];
		for (const subscriber2 of turn2[0].v) {
			if (subscriber2[0] !== handle[1]) {
				kept_pending.push(__clone(subscriber2));
			}
		}
		turn2[0].v = kept_pending;
		turn2[2].v.delete(hash2(handle[1]));
		let kept_derived = [  ];
		for (const subscriber3 of turn2[1].v) {
			if (subscriber3[0] !== handle[1]) {
				kept_derived.push(__clone(subscriber3));
			}
		}
		turn2[1].v = kept_derived;
		turn2[3].v.delete(hash2(handle[1]));
		$E = undefined;
	} else {
		$E = undefined;
	}
	$E;
	const $F = handle[3].v;
	let $G = null;
	if ($F[0] === 0) {
		const release = $F[1];
		handle[3].v = [ 1 ];
		releasing_turns.v.push(ambient);
		__with_finally(release, () => {
			__list_pop(releasing_turns.v);
			return;
		});
		$G = undefined;
	} else {
		$G = undefined;
	}
	return $G;
}
function new3() {
	return [ __shared_new([ 0, no_cleanups, false, [ 1 ] ]), 0 ];
}
function is_disposed(self) {
	return self[0].v[0] !== self[1];
}
function defer(self, cleanup) {
	let $H = null;
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
		$H = undefined;
	}
	return $H;
}
function renew(self) {
	const $bm = self[0].v[3];
	let $bn = null;
	if ($bm[0] === 0) {
		const nursery2 = __clone($bm[1]);
		let $bo = null;
		if (has_spawned(nursery2)) {
			$bo = [ 1 ];
		} else {
			$bo = [ 0, nursery2 ];
		}
		$bn = $bo;
	} else {
		$bn = [ 1 ];
	}
	const carried = $bn;
	advance([ self[0], self[0].v[0] ], carried);
	if (is_none(self[0].v[3])) {
		run_nurseries_allocated_count.v = run_nurseries_allocated_count.v + 1;
		self[0].v[3] = [ 0, detached_nursery() ];
	}
	return [ self[0], self[0].v[0] ];
}
function nursery(self) {
	let $bz = null;
	if (is_disposed(self)) {
		$bz = [ 1 ];
	} else {
		$bz = self[0].v[3];
	}
	return $bz;
}
function dispose2(self) {
	advance(self, [ 1 ]);
}
function advance(self, carried) {
	let $by = null;
	if (!(is_disposed(self))) {
		const held = self[0].v;
		self[0].v = [ self[1] + 1, no_cleanups, false, carried ];
		const $bp = held[3];
		let $bq = null;
		if ($bp[0] === 0) {
			const nursery2 = $bp[1];
			if (is_none(carried)) {
				nursery2.cancel();
			}
			$bq = undefined;
		} else {
			$bq = undefined;
		}
		$bq;
		let $bx = null;
		if (held[2]) {
			let failure = [ 1 ];
			for (const cleanup of held[1].v) {
				const $bs = __guarded(cleanup);
				let $bt = null;
				if ($bs[0] === 0) {
					const message = $bs[1];
					if (is_none(failure)) {
						failure = [ 0, message ];
					}
					$bt = undefined;
				} else {
					$bt = undefined;
				}
				$bt;
			}
			const $bv = failure;
			let $bw = null;
			if ($bv[0] === 0) {
				const message2 = $bv[1];
				$bw = (() => {
					throw __panic(message2, "std/src/reactive.vl:1207:27");
				})();
			} else {
				$bw = undefined;
			}
			$bx = $bw;
		}
		$by = $bx;
	}
	return $by;
}
function get_owner($t) {
	return $t;
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
	const $bh = tracker[0].v[6];
	let $bi = null;
	if ($bh[0] === 0) {
		const lists = $bh[1];
		if (!(is_empty(lists.v[0]))) {
			lists.v[0] = [  ];
		}
		$bi = undefined;
	} else {
		$bi = undefined;
	}
	$bi;
	return [ __clone(tracker), epoch ];
}
function close_run(tracker) {
	tracker[0].v[1] = false;
	const $bE = tracker[0].v[6];
	let $bF = null;
	if ($bE[0] === 0) {
		const lists = $bE[1];
		$bF = lists;
	} else {
		return;
		$bF = undefined;
	}
	const lists2 = $bF;
	const $bG = tracker[0].v[5];
	let $bH = null;
	if ($bG[0] === 0) {
		const target2 = __clone($bG[1]);
		$bH = reconnect(tracker, lists2, target2);
	} else {
		if (!(is_empty(lists2.v[0])) || !(is_empty(lists2.v[1]))) {
			lists2.v[1] = __clone(lists2.v[0]);
		}
		$bH = undefined;
	}
	$bH;
	if (!(is_empty(lists2.v[0]))) {
		lists2.v[0] = [  ];
	}
}
function reconnect(tracker, lists, target2) {
	if (is_empty(lists.v[0]) && is_empty(lists.v[2])) {
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
		const $bM = reusable(held, kept, dependency[0], position);
		let $bN = null;
		if ($bM[0] === 0) {
			const index = $bM[1];
			__at_put(kept, index, true, "std/src/reactive.vl:1624:5");
			next.push(__clone(__at(held, index, "std/src/reactive.vl:1625:15")));
			$bN = undefined;
		} else {
			next.push([ dependency[0], dependency[1](relay_for(tracker, target2)) ]);
			$bN = undefined;
		}
		$bN;
		position = position + 1;
	}
	lists.v[2] = next;
	let index2 = 0;
	for (const edge of held) {
		if (!(__at(kept, index2, "std/src/reactive.vl:1639:7"))) {
			detach(edge[1]);
		}
		index2 = index2 + 1;
	}
	tracker[0].v[3] = false;
}
function reusable(held, kept, identity, position) {
	const $bI = identity;
	let $bJ = null;
	if ($bI[0] === 0) {
		const wanted = $bI[1];
		if (position < held.length && !(__at(kept, position, "std/src/reactive.vl:1662:9")) && same_identity(__at(held, position, "std/src/reactive.vl:1663:22")[0], wanted)) {
			return [ 0, position ];
		}
		let index = 0;
		while (index < held.length) {
			if (!(__at(kept, index, "std/src/reactive.vl:1668:9")) && same_identity(__at(held, index, "std/src/reactive.vl:1668:38")[0], wanted)) {
				return [ 0, index ];
			}
			index = index + 1;
		}
		$bJ = [ 1 ];
	} else {
		$bJ = [ 1 ];
	}
	return $bJ;
}
function same_identity(identity, wanted) {
	const $bK = identity;
	let $bL = null;
	if ($bK[0] === 0) {
		const held = $bK[1];
		$bL = held === wanted;
	} else {
		$bL = false;
	}
	return $bL;
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
	const $bY = tracker[0].v[6];
	let $bZ = null;
	if ($bY[0] === 0) {
		const lists = $bY[1];
		$bZ = lists;
	} else {
		return;
		$bZ = undefined;
	}
	const lists2 = $bZ;
	let $ca = null;
	if (!(is_empty(lists2.v[1]))) {
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
		$ca = undefined;
	}
	return $ca;
}
function forget_reads(tracker) {
	const $cb = tracker[0].v[6];
	let $cc = null;
	if ($cb[0] === 0) {
		const lists = $cb[1];
		$cc = lists;
	} else {
		return;
		$cc = undefined;
	}
	const lists2 = $cc;
	let $cd = null;
	if (!(is_empty(lists2.v[2]))) {
		const edges = __clone(lists2.v[2]);
		lists2.v[2] = [  ];
		for (const edge of edges) {
			detach(edge[1]);
		}
		$cd = undefined;
	}
	$cd;
	if (!(is_empty(lists2.v[1]))) {
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
		const $ce = previous;
		let $cf = null;
		if ($ce[0] === 0) {
			const earlier = $ce[1];
			$cf = earlier();
		} else {
			$cf = undefined;
		}
		return $cf;
	} ];
}
function has_spawned(self) {
	return __nursery_has_spawned(self);
}
function ambient_signal($at) {
	const $au = $at;
	let $av = null;
	if ($au[0] === 0) {
		const n = $au[1];
		$av = [ 0, n.signal_of() ];
	} else {
		$av = [ 1 ];
	}
	return $av;
}
function detached_nursery() {
	return __nursery_new_detached();
}
function clamp_delay(ms) {
	let $ar = null;
	if (ms < 0) {
		$ar = 0;
	} else {
		$ar = ms;
	}
	return $ar;
}
function after(ms) {
	return [ __timer(clamp_delay(ms)) ];
}
async function wait(self, $as) {
	return await (self[0].wait(ambient_signal($as)));
}
function cancel(self) {
	self[0].cancel();
}
function slot_of(key) {
	const parts = key.split(":");
	if (parts.length !== 3) {
		(() => {
			throw __panic("this style\'s slot key is not one media:condition:property triple (got \"" + key + "\"" + ") \u{2014} every field that reaches a key is fenced against \':\' where it is written, so a key holding another one means a condition token was minted carrying the key\'s own separator; that is the bug, not this read", "std/src/web/style.vl:873:3");
		})();
	}
	return [ __at(parts, 0, "std/src/web/style.vl:875:17"), __at(parts, 1, "std/src/web/style.vl:875:39"), __at(parts, 2, "std/src/web/style.vl:875:60") ];
}
function family_longhands(property) {
	const $M = property;
	let $N = null;
	if ($M === "padding") {
		$N = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($M === "margin") {
		$N = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($M === "inset") {
		$N = ";top;right;bottom;left;";
	} else if ($M === "flex") {
		$N = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($M === "background") {
		$N = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($M === "border") {
		$N = border_longhands();
	} else {
		$N = "";
	}
	return $N;
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
	for (const key of keys(rules)) {
		const slot = slot_of(key);
		if (slot[0] === media && slot[1] === condition && longhands.includes(";" + slot[2] + ";")) {
			remove(out, key);
		}
	}
	return out;
}
function class_list(self) {
	let out = "";
	for (const entry of values(self[0])) {
		const $h = entry;
		const class2 = $h[0];
		const _declaration = $h[1];
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
	for (const key of keys(b[0])) {
		const $K = get2(b[0], key);
		let $L = null;
		if ($K[0] === 0) {
			const entry = $K[1];
			const slot = slot_of(key);
			rules = without_covered(rules, slot[0], slot[1], slot[2]);
			insert(rules, key, entry);
			$L = undefined;
		} else {
			$L = undefined;
		}
		$L;
	}
	return [ rules ];
}
function view(tag) {
	let $g = null;
	if (is_svg_tag(tag)) {
		$g = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$g = [ document.createElement(tag) ];
	}
	return $g;
}
function is_svg_tag(tag) {
	const $e = tag;
	let $f = null;
	if ($e === "svg") {
		$f = true;
	} else if ($e === "path") {
		$f = true;
	} else if ($e === "circle") {
		$f = true;
	} else if ($e === "ellipse") {
		$f = true;
	} else if ($e === "rect") {
		$f = true;
	} else if ($e === "line") {
		$f = true;
	} else if ($e === "polyline") {
		$f = true;
	} else if ($e === "polygon") {
		$f = true;
	} else if ($e === "g") {
		$f = true;
	} else if ($e === "defs") {
		$f = true;
	} else if ($e === "use") {
		$f = true;
	} else if ($e === "symbol") {
		$f = true;
	} else if ($e === "marker") {
		$f = true;
	} else if ($e === "pattern") {
		$f = true;
	} else if ($e === "mask") {
		$f = true;
	} else if ($e === "clipPath") {
		$f = true;
	} else if ($e === "linearGradient") {
		$f = true;
	} else if ($e === "radialGradient") {
		$f = true;
	} else if ($e === "stop") {
		$f = true;
	} else if ($e === "text") {
		$f = true;
	} else if ($e === "tspan") {
		$f = true;
	} else if ($e === "textPath") {
		$f = true;
	} else if ($e === "filter") {
		$f = true;
	} else if ($e === "foreignObject") {
		$f = true;
	} else if ($e === "feGaussianBlur") {
		$f = true;
	} else if ($e === "feColorMatrix") {
		$f = true;
	} else if ($e === "feOffset") {
		$f = true;
	} else if ($e === "feMerge") {
		$f = true;
	} else if ($e === "feMergeNode") {
		$f = true;
	} else if ($e === "feFlood") {
		$f = true;
	} else if ($e === "feComposite") {
		$f = true;
	} else if ($e === "feBlend") {
		$f = true;
	} else if ($e === "feDropShadow") {
		$f = true;
	} else {
		$f = false;
	}
	return $f;
}
function styled(self, style) {
	self[0].setAttribute("class", class_list(style));
	return __clone(self);
}
function on(self, event, handler) {
	self[0].addEventListener(event, () => {
		return turn([ 1 ], ($aw) => {
			return (() => {
				return handler($aw, [ 1 ]);
			})();
		});
	});
	return __clone(self);
}
function place(self, parent) {
	parent[0].appendChild(self[0]);
}
function place2(self, parent) {
	parent[0].appendChild(document.createTextNode(self));
}
function place3(self, parent) {
	for (const item of self) {
		parent[0].appendChild(item[0]);
	}
}
function apply(self, parent, name) {
	parent[0].setAttribute(name, self);
}
function mount_target(id) {
	const element = document.getElementById(id);
	if (__is_null(element)) {
		(() => {
			throw __panic("mount: no element with id \'" + id + "\'", "std/src/browser/web/ui.vl:2320:3");
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
	const $dr = turn([ 1 ], ($dq) => {
		return comp(body);
	});
	const built = $dr[0];
	const root = $dr[1];
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
function page(scroll_fade2, copy, $b, $c, $d) {
	return child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(styled(view("div"), shell), bloom($b, $c), $b, $c), top_bar(scroll_fade2, $b, $c), $b, $c), masthead($b, $c), $b, $c), divider($b, $c), $b, $c), install_section(copy, $b, $c, $d), $b, $c), divider($b, $c), $b, $c), showcase_reactive($b, $c), $b, $c), divider($b, $c), $b, $c), showcase_fullstack($b, $c), $b, $c), divider($b, $c), $b, $c), showcase_compiler($b, $c), $b, $c), divider($b, $c), $b, $c), editor_band($b, $c), $b, $c), divider($b, $c), $b, $c), feature_grid($b, $c), $b, $c), divider($b, $c), $b, $c), dogfood($b, $c), $b, $c), page_footer($b, $c), $b, $c);
}
function install_row(label, command, copy, $ad, $ae, $af) {
	const icon = new5("" + assets + "/icons/copy.svg");
	const pending = __shared_new([ 1 ]);
	return child(child(view("div"), child2(styled(view("p"), install_label), label, $ad, $ae), $ad, $ae), child(child(styled(view("div"), install_command), child2(styled(view("span"), install_command_text), command, $ad, $ae), $ad, $ae), child(on(attr(styled(view("button"), copy_button), "aria-label", "Copy command", $ad, $ae), "click", ($ag, $ah) => {
		copy(command);
		set(icon, "" + assets + "/icons/check.svg", [ 0, $ag ]);
		const $ap = pending.v;
		let $aq = null;
		if ($ap[0] === 0) {
			const timer = $ap[1];
			$aq = cancel(timer);
		} else {
			$aq = undefined;
		}
		$aq;
		const timer2 = after(2400);
		pending.v = [ 0, __clone(timer2) ];
		__task(async () => {
			if (await (wait(timer2, $af))) {
				set(icon, "" + assets + "/icons/copy.svg", [ 0, $ag ]);
			}
			return;
		}, "install_row", __nursery_of($af));
		return;
	}), bind_attr(attr(styled(view("img"), copy_icon), "alt", "", $ad, $ae), "src", __clone(icon), $ad, $ae), $ad, $ae), $ad, $ae), $ad, $ae);
}
function install_section(copy, $W, $X, $Y) {
	return child(child(child(styled(attr(view("section"), "id", "install", $W, $X), add(add(column, section_block), stack)), child2(styled(view("h2"), heading), "One command, the whole toolchain", $W, $X), $W, $X), child(child(child(styled(view("p"), lead), pt("The compiler, dev server with hot reload, formatter, test runner, and language server live in one small binary. There is nothing else to install and nothing to configure. Update any time with ", $W, $X), $W, $X), leaf("vilan upgrade", $W, $X), $W, $X), pt(".", $W, $X), $W, $X), $W, $X), child(child(styled(view("div"), install_split), child(child(child(styled(view("div"), install_grid), install_row("macOS / Linux", "curl -fsSL https://github.com/vilan-lang/vilan/releases/latest/download/install.sh | sh", copy, $W, $X, $Y), $W, $X), install_row("Windows (PowerShell)", "irm https://github.com/vilan-lang/vilan/releases/latest/download/install.ps1 | iex", copy, $W, $X, $Y), $W, $X), install_row("Homebrew", "brew install vilan-lang/vilan/vilan", copy, $W, $X, $Y), $W, $X), $W, $X), child(styled(view("div"), install_art_cell), toolchain_art($W, $X), $W, $X), $W, $X), $W, $X);
}
function showcase(prose, code, $cy, $cz) {
	return child(child(styled(view("div"), showcase_grid), __clone(prose), $cy, $cz), __clone(code), $cy, $cz);
}
function showcase_flipped(code, prose, $cY, $cZ) {
	return child(child(styled(view("div"), showcase_grid_flipped), __clone(code), $cY, $cZ), __clone(prose), $cY, $cZ);
}
function counter_demo($aK, $aL) {
	const count = new6(0);
	return child(child(styled(view("div"), demo_box), child2(on(styled(view("button"), demo_button), "click", ($aM, $aN) => {
		return set_with(count, (n) => {
			return n + 1;
		}, [ 0, $aM ]);
	}), "+1", $aK, $aL), $aK, $aL), child3(styled(view("p"), demo_label), derive(__clone(count), (n, $aT, $aU, $aV) => {
		return "clicked " + n + " times";
	}), $aK, $aL), $aK, $aL);
}
function reactive_snippet($cg, $ch) {
	return code_panel([ ln([ kw("fun", $cg, $ch), t(" ", $cg, $ch), fn("main", $cg, $ch), t("() {", $cg, $ch) ], $cg, $ch), ln([ t("    ", $cg, $ch), kw("let", $cg, $ch), t(" count = ", $cg, $ch), ty("Signal", $cg, $ch), t("::", $cg, $ch), fn("new", $cg, $ch), t("(", $cg, $ch), st("0", $cg, $ch), t(");", $cg, $ch) ], $cg, $ch), ln([ t("    ", $cg, $ch), kw("let", $cg, $ch), t(" _root = ui::", $cg, $ch), fn("mount_root", $cg, $ch), t("(", $cg, $ch), st("\"app\"", $cg, $ch), t(", ||", $cg, $ch) ], $cg, $ch), ln([ t("        <", $cg, $ch), ty("div", $cg, $ch), t(">", $cg, $ch) ], $cg, $ch), ln([ t("            <", $cg, $ch), ty("p", $cg, $ch), t(">{count.", $cg, $ch), fn("derive", $cg, $ch), t("(|n: i32| ", $cg, $ch), st("i\"clicked ", $cg, $ch), hl("{", $cg, $ch), t("n", $cg, $ch), hl("}", $cg, $ch), st(" times\"", $cg, $ch), t(")}</", $cg, $ch), ty("p", $cg, $ch), t(">", $cg, $ch) ], $cg, $ch), ln([ t("            <", $cg, $ch), ty("button", $cg, $ch), t(" ", $cg, $ch), fn("on:click", $cg, $ch), t("(|| count.", $cg, $ch), fn("set_with", $cg, $ch), t("(|n| n + ", $cg, $ch), st("1", $cg, $ch), t("))>", $cg, $ch), st("\"+1\"", $cg, $ch), t("</", $cg, $ch), ty("button", $cg, $ch), t(">", $cg, $ch) ], $cg, $ch), ln([ t("        </", $cg, $ch), ty("div", $cg, $ch), t(">);", $cg, $ch) ], $cg, $ch), ln([ t("}", $cg, $ch) ], $cg, $ch) ], $cg, $ch);
}
function showcase_reactive($aI, $aJ) {
	const prose = child(child(child(child(styled(view("div"), showcase_copy), child2(styled(view("h2"), heading), "UI that follows your data", $aI, $aJ), $aI, $aJ), child(child(child(styled(view("p"), lead), pt("A view is a value and a binding is a subscription: a ", $aI, $aJ), $aI, $aJ), leaf("{signal}", $aI, $aJ), $aI, $aJ), pt(" hole sets the text node once, then sets it again whenever the signal changes. There is no virtual DOM, no render loop, and no dependency array to babysit. Updates land exactly where the data changed.", $aI, $aJ), $aI, $aJ), $aI, $aJ), child2(styled(view("p"), lead), "The snippet is the whole program, and it runs. Try it right here:", $aI, $aJ), $aI, $aJ), counter_demo($aI, $aJ), $aI, $aJ);
	return child(child(styled(view("section"), add(add(column, section_block), stack)), showcase(prose, reactive_snippet($aI, $aJ), $aI, $aJ), $aI, $aJ), dataflow_art($aI, $aJ), $aI, $aJ);
}
function showcase_fullstack($cI, $cJ) {
	return child(child(child(child(styled(view("section"), add(add(column, section_block), stack)), child2(styled(view("h2"), heading), "The server is a struct. The client is generated.", $cI, $cJ), $cI, $cJ), child(child(child(child(child(styled(view("p"), lead), pt("Mark a method ", $cI, $cJ), $cI, $cJ), leaf_link("/docs/guide/services.html#what-rpc-calls-do", "[rpc]", $cI, $cJ), $cI, $cJ), pt(" and the browser can call it like any other function, typed and checked. Mark a signal ", $cI, $cJ), $cI, $cJ), leaf_link("/docs/guide/services.html#mirrors", "[expose]", $cI, $cJ), $cI, $cJ), pt(" and every connected client holds a live mirror that updates when the server writes. You never write REST endpoints, fetch calls, or the JSON shapes that drift out of sync between them.", $cI, $cJ), $cI, $cJ), $cI, $cJ), diagram($cI, $cJ), $cI, $cJ), button_link("/docs/guide/services.html", "Services & RPC in the guide", $cI, $cJ), $cI, $cJ);
}
function diagnosed_snippet($cU, $cV) {
	return code_panel([ ln([ kw("fun", $cU, $cV), t(" ", $cU, $cV), fn("find_user", $cU, $cV), t("(id: i32): ", $cU, $cV), ty("Option", $cU, $cV), t("<str> {", $cU, $cV) ], $cU, $cV), ln([ t("    ", $cU, $cV), kw("if", $cU, $cV), t(" id == ", $cU, $cV), st("1", $cU, $cV), t(" { ", $cU, $cV), ty("Some", $cU, $cV), t("(", $cU, $cV), st("\"Ada\"", $cU, $cV), t(") } ", $cU, $cV), kw("else", $cU, $cV), t(" { ", $cU, $cV), ty("None", $cU, $cV), t(" }", $cU, $cV) ], $cU, $cV), ln([ t("}", $cU, $cV) ], $cU, $cV), ln([ kw("fun", $cU, $cV), t(" ", $cU, $cV), fn("greet", $cU, $cV), t("(name: str): str {", $cU, $cV) ], $cU, $cV), ln([ t("    ", $cU, $cV), st("i\"hello ", $cU, $cV), hl("{", $cU, $cV), t("name", $cU, $cV), hl("}", $cU, $cV), st("\"", $cU, $cV) ], $cU, $cV), ln([ t("}", $cU, $cV) ], $cU, $cV), ln([ kw("fun", $cU, $cV), t(" ", $cU, $cV), fn("main", $cU, $cV), t("() {", $cU, $cV) ], $cU, $cV), ln([ t("    ", $cU, $cV), fn("print", $cU, $cV), t("(", $cU, $cV), fn("greet", $cU, $cV), t("(", $cU, $cV), fn("find_user", $cU, $cV), t("(", $cU, $cV), st("2", $cU, $cV), t(")));", $cU, $cV) ], $cU, $cV), ln([ t("}", $cU, $cV) ], $cU, $cV) ], $cU, $cV);
}
function diagnostic_terminal($cW, $cX) {
	return child(child(child(child(child(child(child(styled(view("pre"), diag_pre), ln([ child2(styled(view("span"), diag_error), "Error:", $cW, $cX), t(" Expected str, but got Option<str> instead.", $cW, $cX) ], $cW, $cX), $cW, $cX), ln([ child2(styled(view("span"), diag_frame), "   \u{256d}\u{2500}[ demo.vl:8:14 ]", $cW, $cX) ], $cW, $cX), $cW, $cX), ln([ child2(styled(view("span"), diag_frame), "   \u{2502}", $cW, $cX) ], $cW, $cX), $cW, $cX), ln([ child2(styled(view("span"), diag_frame), " 8 \u{2502}     print(greet(find_user(2)));", $cW, $cX) ], $cW, $cX), $cW, $cX), ln([ child2(styled(view("span"), diag_frame), "   \u{2502}                 \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{252c}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}", $cW, $cX) ], $cW, $cX), $cW, $cX), ln([ child2(styled(view("span"), diag_frame), "   \u{2502}                       \u{2570}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500} Expected str, but got Option<str> instead.", $cW, $cX) ], $cW, $cX), $cW, $cX), ln([ child2(styled(view("span"), diag_frame), "\u{2500}\u{2500}\u{2500}\u{256f}", $cW, $cX) ], $cW, $cX), $cW, $cX);
}
function showcase_compiler($cS, $cT) {
	const code = child(child(styled(view("div"), diag_stack), diagnosed_snippet($cS, $cT), $cS, $cT), diagnostic_terminal($cS, $cT), $cS, $cT);
	const prose = child(child(child(child(styled(view("div"), showcase_copy), child2(styled(view("h2"), heading), "Find out at compile time", $cS, $cT), $cS, $cT), child(child(child(child(child(styled(view("p"), lead), pt("Vilan has no null and no exceptions. A value that might be missing is an ", $cS, $cT), $cS, $cT), leaf_link("/docs/std/option-result.html#optiont", "Option", $cS, $cT), $cS, $cT), pt(", a call that might fail returns a ", $cS, $cT), $cS, $cT), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $cS, $cT), $cS, $cT), pt(", and the compiler makes you look inside before you use either. The mistake in this snippet is a build error, not a production incident.", $cS, $cT), $cS, $cT), $cS, $cT), child2(styled(view("p"), lead), "Values are copied rather than silently shared, so two names never fight over one object. Most of the mistakes JavaScript saves for runtime cannot even be written.", $cS, $cT), $cS, $cT), button_link("/docs/std/option-result.html", "Option & Result in the reference", $cS, $cT), $cS, $cT);
	return child(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped(code, prose, $cS, $cT), $cS, $cT);
}
function editor_band($da, $db) {
	const prose = child(child(child(child(styled(view("div"), showcase_copy), child2(styled(view("h2"), heading), "The editor is in on it", $da, $db), $da, $db), child(child(child(child(styled(view("p"), lead), leaf("vilan", $da, $db), $da, $db), pt(" and ", $da, $db), $da, $db), leaf("vilan-lsp", $da, $db), $da, $db), pt(" ship together so your editor and build never disagree. In-editor diagnostics, hover types and docs, autocompletion, Symbol Rename, formatting, and Organize Imports are all available in VS Code today.", $da, $db), $da, $db), $da, $db), child2(styled(view("p"), lead), "One broken line does not take the tooling down. The rest of the file keeps compiling, serving hovers, and completing while you fix it.", $da, $db), $da, $db), button_link("https://github.com/vilan-lang/vilan/tree/main/editors/vscode", "The VS Code extension", $da, $db), $da, $db);
	return child(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped(editor_art($da, $db), prose, $da, $db), $da, $db);
}
function button_link(href, label, $cQ, $cR) {
	return child(child(attr(styled(view("a"), button_link_style), "href", href, $cQ, $cR), pt(label, $cQ, $cR), $cQ, $cR), attr(attr(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $cQ, $cR), "alt", "", $cQ, $cR), $cQ, $cR);
}
function docs_link(href, label, $di, $dj) {
	return child(child(attr(styled(view("a"), card_link), "href", href, $di, $dj), pt(label, $di, $dj), $di, $dj), attr(attr(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $di, $dj), "alt", "", $di, $dj), $di, $dj);
}
function feature(icon, name, href, body, $dg, $dh) {
	return child(child(child(child(styled(view("article"), card), attr(attr(styled(view("img"), card_icon), "src", "" + assets + "/icons/" + icon + ".svg", $dg, $dh), "alt", "", $dg, $dh), $dg, $dh), child2(styled(view("h3"), card_title), name, $dg, $dh), $dg, $dh), child4(styled(view("p"), card_body), __clone(body), $dg, $dh), $dg, $dh), docs_link(href, "docs", $dg, $dh), $dg, $dh);
}
function feature_grid($de, $df) {
	return child(child(styled(view("section"), add(add(column, section_block), stack)), child2(styled(view("h2"), heading), "Built into the language", $de, $df), $de, $df), child(child(child(child(child(child(attr(styled(view("div"), cards_grid), "data-glow", "", $de, $df), feature("shield-check", "No null, no exceptions", "/docs/std/option-result.html", [ pt("A missing value is an ", $de, $df), leaf_link("/docs/std/option-result.html#optiont", "Option", $de, $df), pt(", a failure is a ", $de, $df), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $de, $df), pt(", and ", $de, $df), leaf("match", $de, $df), pt(" makes you handle both arms. Errors are ordinary values you pass around like any other data.", $de, $df) ], $de, $df), $de, $df), feature("copy", "Values, not references", "/docs/tour/memory-model.html", [ pt("Assignment copies. Sharing is explicit, borrowing is checked, and spooky action at a distance is a compile error.", $de, $df) ], $de, $df), $de, $df), feature("zap", "Async without the ceremony", "/docs/tour/async.html", [ leaf_link("/docs/tour/async.html#opting-out-of-waiting-async-and-await", "await", $de, $df), pt(" is implicit. Call an async function and the machinery is the compiler\'s problem. When you want real concurrency, tasks and ", $de, $df), leaf_link("/docs/tour/async.html#nurseries-structured-spawning", "nurseries", $de, $df), pt(" give it structure.", $de, $df) ], $de, $df), $de, $df), feature("layers", "One program, two platforms", "/docs/tour/platforms.html", [ pt("One workspace compiles the node server and the browser client. The compiler tracks which code needs which platform and keeps each bundle honest.", $de, $df) ], $de, $df), $de, $df), feature("server", "Rendered before it ships", "/docs/guide/ssr.html", [ leaf("std::web::ui", $de, $df), pt(" renders on the server too: first paint is real markup, then the client rebuilds it live. View source on this page and the content is already there.", $de, $df) ], $de, $df), $de, $df), feature("refresh-cw", "A dev loop that keeps up", "/docs/guide/dev-loop.html", [ leaf("vilan run . --watch", $de, $df), pt(" rebuilds in milliseconds and hot-reloads the browser. Format, test, and language server ship in the same binary.", $de, $df) ], $de, $df), $de, $df), $de, $df);
}
function dogfood($dk, $dl) {
	return child(child(child(styled(view("section"), add(add(column, section_block), stack)), child2(styled(view("p"), dogfood_text), "This site is a vilan program: one package, three entries \u{2014} this page, the playground, and the server that renders both. The server rendered the markup you first saw, and the browser rebuilt it live.", $dk, $dl), $dk, $dl), child2(styled(view("p"), dogfood_text), "Vilan is built to last. Semantics are settled on paper before they are implemented, and pinned by tests after. A language is a foundation, and a foundation should not move under you.", $dk, $dl), $dk, $dl), child(styled(view("p"), dogfood_cta), docs_link("https://github.com/vilan-lang/website", "Read this page\'s source", $dk, $dl), $dk, $dl), $dk, $dl);
}
function footer_column(title, links, $do, $dp) {
	return child(child(view("div"), child2(styled(view("p"), footer_head), title, $do, $dp), $do, $dp), child4(styled(view("div"), footer_list), __clone(links), $do, $dp), $do, $dp);
}
function page_footer($dm, $dn) {
	return child(child(styled(view("footer"), footer_block), child(child(child(child(styled(view("div"), add(column, footer_grid)), styled(attr(attr(attr(view("img"), "src", "" + assets + "/footer_mark.webp", $dm, $dn), "alt", "The vilan mark", $dm, $dn), "width", "200", $dm, $dn), footer_mark), $dm, $dn), footer_column("Using Vilan", [ child2(attr(styled(view("a"), footer_link), "href", "#install", $dm, $dn), "Install", $dm, $dn), child2(attr(styled(view("a"), footer_link), "href", "/docs/tour/hello-vilan.html", $dm, $dn), "Learn", $dm, $dn), child2(attr(styled(view("a"), footer_link), "href", "/playground", $dm, $dn), "Playground", $dm, $dn), child2(attr(styled(view("a"), footer_link), "href", "/docs/", $dm, $dn), "Documentation", $dm, $dn) ], $dm, $dn), $dm, $dn), footer_column("Community", [ child2(attr(styled(view("a"), footer_link), "href", "" + repo + "/issues", $dm, $dn), "Issues", $dm, $dn), child2(attr(styled(view("a"), footer_link), "href", "" + repo + "/discussions", $dm, $dn), "Discussions", $dm, $dn), child2(attr(styled(view("a"), footer_link), "href", "https://github.com/vilan-lang", $dm, $dn), "GitHub", $dm, $dn) ], $dm, $dn), $dm, $dn), footer_column("Terms & policies", [ child2(attr(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/CODE_OF_CONDUCT.md", $dm, $dn), "Code of Conduct", $dm, $dn), child2(attr(styled(view("a"), footer_link), "href", "" + repo + "#license", $dm, $dn), "Licenses", $dm, $dn), child2(attr(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/assets/branding/LICENSE", $dm, $dn), "Logo Policy", $dm, $dn) ], $dm, $dn), $dm, $dn), $dm, $dn), child(styled(view("div"), column), child(child(styled(view("div"), footer_micro), child2(view("span"), "\u{a9} 2026 Reed Syllas", $dm, $dn), $dm, $dn), child2(view("span"), "MIT or Apache-2.0", $dm, $dn), $dm, $dn), $dm, $dn), $dm, $dn);
}
function diagram($cM, $cN) {
	return child(child(child(child(child(child(child(child(styled(view("div"), art_stage), styled(view("div"), dg_blob_top), $cM, $cN), styled(view("div"), dg_blob_left), $cM, $cN), styled(view("div"), dg_blob_right), $cM, $cN), grain(), $cM, $cN), child(child(styled(view("div"), dg_source), child2(styled(view("p"), art_tab), "notes.vl \u{b7} one source", $cM, $cN), $cM, $cN), child(child(child(child(child(child(child(child(child(styled(view("div"), art_code), ln([ t("[", $cM, $cN), kw("service", $cM, $cN), t("(NotesClient)]", $cM, $cN) ], $cM, $cN), $cM, $cN), ln([ kw("struct", $cM, $cN), t(" Notes {", $cM, $cN) ], $cM, $cN), $cM, $cN), ln([ t("    [", $cM, $cN), kw("expose", $cM, $cN), t("] entries: SignalCell<List<Note>>,", $cM, $cN) ], $cM, $cN), $cM, $cN), ln([ t("}", $cM, $cN) ], $cM, $cN), $cM, $cN), blank($cM, $cN), $cM, $cN), ln([ kw("impl", $cM, $cN), t(" Notes {", $cM, $cN) ], $cM, $cN), $cM, $cN), ln([ t("    [", $cM, $cN), kw("rpc", $cM, $cN), t("]", $cM, $cN) ], $cM, $cN), $cM, $cN), ln([ t("    ", $cM, $cN), kw("fun", $cM, $cN), t(" add(self, text: str): i32 { \u{2026} }", $cM, $cN) ], $cM, $cN), $cM, $cN), ln([ t("}", $cM, $cN) ], $cM, $cN), $cM, $cN), $cM, $cN), $cM, $cN), child(child(child(child(styled(view("div"), dg_wire_zone), styled(view("div"), dg_wire_left), $cM, $cN), styled(view("div"), dg_wire_right), $cM, $cN), child2(styled(view("span"), dg_wire_label_left), "vilan build", $cM, $cN), $cM, $cN), child2(styled(view("span"), dg_wire_label_right), "vilan build", $cM, $cN), $cM, $cN), $cM, $cN), child(child(child(styled(view("div"), dg_legs), child(child(styled(view("div"), art_card), child(child(child(styled(view("div"), dg_leg_head), styled(view("div"), dot_magenta), $cM, $cN), child2(styled(view("span"), dg_leg_name), "the server", $cM, $cN), $cM, $cN), child2(styled(view("span"), dg_leg_env), "node", $cM, $cN), $cM, $cN), $cM, $cN), child(child(styled(view("div"), art_code), ln([ t("serve_service(4000,", $cM, $cN) ], $cM, $cN), $cM, $cN), ln([ t("    notes.dispatcher() \u{2026})", $cM, $cN) ], $cM, $cN), $cM, $cN), $cM, $cN), $cM, $cN), child(child(styled(view("div"), dg_mid), child(child(view("div"), child2(styled(view("p"), dg_mid_label), "notes.add(\"ship it\")", $cM, $cN), $cM, $cN), child(child(styled(view("div"), dg_line_row), styled(view("div"), arrow_head_left), $cM, $cN), styled(view("div"), dg_line), $cM, $cN), $cM, $cN), $cM, $cN), child(child(child(view("div"), child(child(styled(view("div"), dg_line_row), styled(view("div"), dg_line_dashed), $cM, $cN), styled(view("div"), arrow_head_right_rose), $cM, $cN), $cM, $cN), child2(styled(view("p"), dg_mid_label_rose), "entries", $cM, $cN), $cM, $cN), child2(styled(view("p"), dg_note), "mirrored live", $cM, $cN), $cM, $cN), $cM, $cN), $cM, $cN), child(child(styled(view("div"), art_card), child(child(child(styled(view("div"), dg_leg_head), styled(view("div"), dot_orange), $cM, $cN), child2(styled(view("span"), dg_leg_name), "the client", $cM, $cN), $cM, $cN), child2(styled(view("span"), dg_leg_env), "browser", $cM, $cN), $cM, $cN), $cM, $cN), child(child(styled(view("div"), art_code), ln([ kw("let", $cM, $cN), t(" notes = NotesClient::connect(", $cM, $cN), st("\"/rpc\"", $cM, $cN), t(");", $cM, $cN) ], $cM, $cN), $cM, $cN), ln([ t("notes.entries ", $cM, $cN), t("// Signal, live", $cM, $cN) ], $cM, $cN), $cM, $cN), $cM, $cN), $cM, $cN), $cM, $cN), child2(styled(view("p"), art_caption), "one definition: the compiler builds both sides and keeps them honest", $cM, $cN), $cM, $cN);
}
function editor_art($dc, $dd) {
	return child(child(child(child(styled(view("div"), art_stage), styled(view("div"), ed_blob_a), $dc, $dd), styled(view("div"), ed_blob_b), $dc, $dd), grain(), $dc, $dd), child(child(child(child(styled(view("div"), ed_window), child(child(child(child(styled(view("div"), ed_titlebar), styled(view("div"), ed_dot_red), $dc, $dd), styled(view("div"), ed_dot_orange), $dc, $dd), styled(view("div"), ed_dot_magenta), $dc, $dd), child2(styled(view("span"), ed_title), "app.vl \u{2014} vilan", $dc, $dd), $dc, $dd), $dc, $dd), child(child(styled(view("div"), ed_body), child2(styled(view("div"), ed_gutter), "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11", $dc, $dd), $dc, $dd), child(child(child(child(child(child(child(child(child(child(child(styled(view("div"), ed_code), ln([ kw("import", $dc, $dd), t(" std::io::print;", $dc, $dd) ], $dc, $dd), $dc, $dd), ln([ kw("import", $dc, $dd), t(" std::option::Option::{ self, Some, None };", $dc, $dd) ], $dc, $dd), $dc, $dd), ln([ kw("fun", $dc, $dd), t(" find_user(id: i32): Option<str> {", $dc, $dd) ], $dc, $dd), $dc, $dd), ln([ t("    ", $dc, $dd), kw("if", $dc, $dd), t(" id == 1 { Some(", $dc, $dd), st("\"Ada\"", $dc, $dd), t(") } ", $dc, $dd), kw("else", $dc, $dd), t(" { None }", $dc, $dd) ], $dc, $dd), $dc, $dd), ln([ t("}", $dc, $dd) ], $dc, $dd), $dc, $dd), ln([ kw("fun", $dc, $dd), t(" greet(name: str): str {", $dc, $dd) ], $dc, $dd), $dc, $dd), ln([ t("    ", $dc, $dd), st("i\"hello {name}\"", $dc, $dd) ], $dc, $dd), $dc, $dd), ln([ t("}", $dc, $dd) ], $dc, $dd), $dc, $dd), ln([ kw("fun", $dc, $dd), t(" main() {", $dc, $dd) ], $dc, $dd), $dc, $dd), ln([ t("    print(greet(", $dc, $dd), child2(styled(view("span"), ed_squiggle), "find_user(2)", $dc, $dd), t("));", $dc, $dd), styled(view("span"), ed_caret) ], $dc, $dd), $dc, $dd), ln([ t("}", $dc, $dd) ], $dc, $dd), $dc, $dd), $dc, $dd), $dc, $dd), child(child(child(styled(view("div"), ed_statusbar), child2(styled(view("span"), ed_problem), "\u{2297} 1", $dc, $dd), $dc, $dd), child2(view("span"), "vilan-lsp", $dc, $dd), $dc, $dd), child2(styled(view("span"), ed_status_right), "Ln 10, Col 17 \u{b7} app.vl", $dc, $dd), $dc, $dd), $dc, $dd), child(child(styled(view("div"), ed_hover), child2(styled(view("div"), ed_hover_error), "Expected str, but got Option<str> instead.", $dc, $dd), $dc, $dd), child2(styled(view("div"), ed_hover_from), "vilan \u{b7} live as you type", $dc, $dd), $dc, $dd), $dc, $dd), $dc, $dd);
}
function tc_chip_at(left, top, color, label, $aG, $aH) {
	return child(child(attr(styled(view("div"), tc_chip), "style", "left: " + left + "; top: " + top, $aG, $aH), attr(styled(view("div"), led), "style", "background: " + color, $aG, $aH), $aG, $aH), child2(view("span"), label, $aG, $aH), $aG, $aH);
}
function toolchain_art($aE, $aF) {
	return child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(styled(view("div"), tc_wrap), styled(view("div"), tc_blob_b), $aE, $aF), styled(view("div"), tc_blob_a), $aE, $aF), styled(view("div"), tc_blob_c), $aE, $aF), grain(), $aE, $aF), styled(view("div"), tc_spoke_up), $aE, $aF), styled(view("div"), tc_spoke_down), $aE, $aF), styled(view("div"), tc_spoke_run), $aE, $aF), styled(view("div"), tc_spoke_fmt), $aE, $aF), styled(view("div"), tc_spoke_lsp), $aE, $aF), styled(view("div"), tc_spoke_upgrade), $aE, $aF), styled(view("div"), tc_center_mask), $aE, $aF), attr(attr(styled(view("div"), tc_center), "aria-label", "vilan", $aE, $aF), "role", "img", $aE, $aF), $aE, $aF), tc_chip_at("210px", "70px", primary[0], "vilan build", $aE, $aF), $aE, $aF), tc_chip_at("328px", "142px", "#D84730", "vilan run --watch", $aE, $aF), $aE, $aF), tc_chip_at("344px", "288px", accent[0], "vilan fmt", $aE, $aF), $aE, $aF), tc_chip_at("210px", "360px", "#B23056", "vilan test", $aE, $aF), $aE, $aF), tc_chip_at("78px", "288px", "#8B2786", "vilan-lsp", $aE, $aF), $aE, $aF), tc_chip_at("82px", "142px", "#672283", "vilan upgrade", $aE, $aF), $aE, $aF);
}
function df_arrow_to(label, $cG, $cH) {
	return child(child(styled(view("div"), df_arrow), child2(styled(view("span"), df_arrow_label), label, $cG, $cH), $cG, $cH), child(child(styled(view("div"), df_arrow_row), styled(view("div"), dg_line), $cG, $cH), styled(view("div"), arrow_head_right), $cG, $cH), $cG, $cH);
}
function df_node_view(lit, tag, body, $cC, $cD) {
	const $cF = view("div");
	let $cE = null;
	if (lit) {
		$cE = df_node_lit;
	} else {
		$cE = df_node;
	}
	return child(child(styled($cF, $cE), child2(styled(view("p"), df_tag), tag, $cC, $cD), $cC, $cD), child(styled(view("div"), art_code), ln(body, $cC, $cD), $cC, $cD), $cC, $cD);
}
function dataflow_art($cA, $cB) {
	return child(child(child(child(child(styled(view("div"), df_wrap), styled(view("div"), df_blob_a), $cA, $cB), styled(view("div"), df_blob_b), $cA, $cB), grain(), $cA, $cB), child(child(child(child(child(styled(view("div"), df_row), df_node_view(false, "the write", [ t("count.set(", $cA, $cB), st("2", $cA, $cB), t(")", $cA, $cB) ], $cA, $cB), $cA, $cB), df_arrow_to("notify", $cA, $cB), $cA, $cB), df_node_view(false, "the signal", [ t("SignalCell<i32> ", $cA, $cB), kw("= 2", $cA, $cB) ], $cA, $cB), $cA, $cB), df_arrow_to("re-set", $cA, $cB), $cA, $cB), df_node_view(true, "the one text node", [ t("<p>clicked ", $cA, $cB), kw("2", $cA, $cB), t(" times</p>", $cA, $cB) ], $cA, $cB), $cA, $cB), $cA, $cB), child2(styled(view("p"), art_caption), "no virtual DOM, no re-render: the subscription updates exactly one node", $cA, $cB), $cA, $cB);
}
function kw(text, $ci, $cj) {
	return child2(styled(view("span"), tk_keyword), text, $ci, $cj);
}
function st(text, $cs, $ct) {
	return child2(styled(view("span"), tk_string), text, $cs, $ct);
}
function t(text, $ck, $cl) {
	return child2(styled(view("span"), tk_plain), text, $ck, $cl);
}
function fn(text, $cm, $cn) {
	return child2(styled(view("span"), tk_callable), text, $cm, $cn);
}
function ty(text, $cq, $cr) {
	return child2(styled(view("span"), tk_type), text, $cq, $cr);
}
function hl(text, $cu, $cv) {
	return child2(styled(view("span"), tk_hole), text, $cu, $cv);
}
function ln(spans, $co, $cp) {
	return child4(view("div"), __clone(spans), $co, $cp);
}
function blank($cO, $cP) {
	return child2(view("div"), " ", $cO, $cP);
}
function code_panel(lines, $cw, $cx) {
	return child4(styled(view("pre"), code_pre), __clone(lines), $cw, $cx);
}
function leaf(text, $ab, $ac) {
	return child2(styled(view("code"), leaf_style), text, $ab, $ac);
}
function leaf_link(href, text, $cK, $cL) {
	return child2(attr(styled(view("a"), leaf_link_style), "href", href, $cK, $cL), text, $cK, $cL);
}
function pt(text, $Z, $aa) {
	return child2(view("span"), text, $Z, $aa);
}
function bloom($i, $j) {
	return child(styled(view("div"), bloom_field), child(child(styled(view("div"), bloom_drift), child(styled(view("div"), bloom_blurwrap), styled(view("div"), bloom_gradient), $i, $j), $i, $j), styled(view("div"), bloom_duo), $i, $j), $i, $j);
}
function hero($S, $T) {
	return child(child(child(child(styled(view("header"), hero_block), child2(styled(view("h1"), visually_hidden), "Vilan \u{2014} The Modern Web Language", $S, $T), $S, $T), attr(attr(styled(view("img"), hero_mark), "src", "" + assets + "/dark_logo_flat.svg", $S, $T), "alt", "", $S, $T), $S, $T), attr(attr(styled(view("img"), hero_wordmark), "src", "" + assets + "/wordmark_hero.svg", $S, $T), "alt", "VILAN", $S, $T), $S, $T), child2(attr(styled(view("p"), hero_tagline), "aria-hidden", "true", $S, $T), "The Modern Web Language", $S, $T), $S, $T);
}
function masthead($Q, $R) {
	return child(styled(view("div"), masthead_wrap), hero($Q, $R), $Q, $R);
}
function divider($U, $V) {
	return child(styled(view("div"), column), styled(view("div"), rule_line), $U, $V);
}
function grain() {
	return styled(view("div"), grain_overlay);
}
function top_bar(scroll_fade2, $m, $n) {
	return child(style_var(styled(view("nav"), topbar), "--nav-fade", __clone(scroll_fade2), $m, $n), child(child(styled(view("div"), add(column, nav_row)), child(child(attr(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $m, $n), attr(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $m, $n), $m, $n), child2(view("span"), "VILAN", $m, $n), $m, $n), $m, $n), child(child(child(child(styled(view("div"), nav_links), child2(attr(styled(view("a"), nav_link), "href", "/#install", $m, $n), "Install", $m, $n), $m, $n), child2(attr(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html", $m, $n), "Learn", $m, $n), $m, $n), child2(attr(styled(view("a"), nav_link), "href", "/playground/", $m, $n), "Playground", $m, $n), $m, $n), child2(attr(styled(view("a"), nav_link), "href", "/docs/", $m, $n), "Docs", $m, $n), $m, $n), $m, $n), $m, $n);
}
function new4(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function new5(value) {
	return new4(value);
}
function values(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry.slice(1, 3)));
	}
	return result;
}
function child(self, content, $k, $l) {
	place(content, self, $k, $l);
	return __clone(self);
}
function attach(signal, subscriber) {
	const handle = [ signal[1], subscriber[0], subscriber[2], __shared_new([ 1 ]) ];
	signal[1].v.push(reissued(subscriber));
	return handle;
}
function observe(signal, observer) {
	const cell = signal[0];
	return attach(signal, mint_subscriber(() => {
		const $u = [ 0, cell ];
		let $v = null;
		if ($u[0] === 0) {
			const live = $u[1];
			$v = observer(live.v);
		} else {
			$v = undefined;
		}
		return $v;
	}));
}
function get(self) {
	return __clone(self[0].v);
}
function attach_observer(self, observer, immediately) {
	const subscription = observe(self, observer);
	if (immediately) {
		observer(get(self));
	}
	return subscription;
}
function sub(self, observer) {
	return attach_observer(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function is_empty(self) {
	return self.length === 0;
}
function last(self) {
	let $A = null;
	if (is_empty(self)) {
		$A = [ 1 ];
	} else {
		$A = __list_get(self, self.length - 1);
	}
	return $A;
}
function take(self, item, $w) {
	defer(self, () => {
		dispose(item, $w);
		return;
	});
	return __clone(item);
}
function follow(flow, observer, $r, $s) {
	take(get_owner($s), sub(flow, observer), $r);
}
function style_var(self, name, source, $o, $p) {
	const element = __clone(self[0]);
	follow(source, (value, $q) => {
		element.style.setProperty(name, value);
		return;
	}, $o, $p);
	return __clone(self);
}
function keys(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[0]));
	}
	return result;
}
function get2(self, key) {
	const $I = __map_get(self[0], hash(key));
	let $J = null;
	if ($I[0] === 0) {
		const entry = $I[1];
		$J = [ 0, __clone(entry.slice(1, 3)) ];
	} else {
		$J = [ 1 ];
	}
	return $J;
}
function remove(self, key) {
	self[0].delete(hash(key));
}
function insert(self, key, value) {
	self[0].set(hash(key), [ __clone(key), ...__clone(value) ]);
}
function attr(self, name, value, $O, $P) {
	apply(value, self, name, $O, $P);
	return __clone(self);
}
function child2(self, content, $k, $l) {
	place2(content, self, $k, $l);
	return __clone(self);
}
function notify(self, $aj) {
	const $ak = $aj;
	let $al = null;
	if ($ak[0] === 0) {
		const turn2 = $ak[1];
		$al = enqueue(turn2, __clone(self[1].v));
	} else {
		const $an = last(draining_turns.v);
		let $ao = null;
		if ($an[0] === 0) {
			const draining = $an[1];
			$ao = enqueue(draining, __clone(self[1].v));
		} else {
			for (const subscriber of __clone(self[1].v)) {
				if (subscriber[2].v) {
					subscriber[1]();
				}
			}
			$ao = undefined;
		}
		$al = $ao;
	}
	return $al;
}
function set(self, value, $ai) {
	self[0].v = __clone(value);
	notify(self, $ai);
}
function turn(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[5].v = true;
	return result;
}
function bind_text_attribute_flow(flow, parent, name, $aB, $aC) {
	const element = __clone(parent[0]);
	follow(flow, (value, $aD) => {
		element.setAttribute(name, value);
		return;
	}, $aB, $aC);
}
function bind_attribute(self, parent, name, $az, $aA) {
	bind_text_attribute_flow(self, parent, name, $az, $aA);
}
function bind_attr(self, name, source, $ax, $ay) {
	bind_attribute(source, self, name, $ax, $ay);
	return __clone(self);
}
function new6(value) {
	return new4(value);
}
function set2(self, value, $ai) {
	self[0].v = __clone(value);
	notify(self, $ai);
}
function set_with(self, transform, $aO) {
	set2(self, transform(get(self)), $aO);
}
function derive(self, transform) {
	return [ self, transform ];
}
function on_settle(self, subscriber) {
	return attach(self, subscriber);
}
function start(self) {
	return [ () => {
		return get(self);
	}, (subscriber) => {
		return on_settle(self, subscriber);
	}, () => {
		return;
	} ];
}
function is_none(self) {
	const $br = self;
	return $br[0] === 1;
}
function run_body(runs, body) {
	const run = renew(runs);
	const $bA = nursery(run);
	let $bB = null;
	if ($bA[0] === 0) {
		const nursery2 = $bA[1];
		$bB = (($bC) => {
			return (($bD) => {
				return body($bC, $bD);
			})(nursery2);
		})(run);
	} else {
		$bB = (() => {
			throw __panic("a renewed run carries its nursery", "std/src/reactive.vl:1318:11");
		})();
	}
	return $bB;
}
function last2(self) {
	let $bS = null;
	if (is_empty(self)) {
		$bS = [ 1 ];
	} else {
		$bS = __list_get(self, self.length - 1);
	}
	return $bS;
}
function run_once(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = run_body(runs, ($bj, $bk) => {
		return (($bl) => {
			return body($bj, $bl, $bk);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function run_tracked(runs, tracker, body) {
	let value = run_once(runs, tracker, ($be, $bf, $bg) => {
		return body($be, $bf, $bg);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = run_once(runs, tracker, ($bV, $bW, $bX) => {
			return body($bV, $bW, $bX);
		});
		rounds = rounds + 1;
	}
	if (tracker[0].v[4]) {
		tracker[0].v[4] = false;
	}
	return value;
}
function start2(self) {
	const transform = self[1];
	const upstream = start(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return run_tracked(runs, tracker, ($bb, $bc, $bd) => {
			return transform(value, $bb, $bc, $bd);
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
function observe_flow(flow, observer, immediately) {
	const instance = start2(flow);
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
function sub2(self, observer) {
	return observe_flow(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function follow2(flow, observer, $r, $s) {
	take(get_owner($s), sub2(flow, observer), $r);
}
function place_text_flow(flow, parent, $aY, $aZ) {
	const node = document.createTextNode("");
	parent[0].appendChild(node);
	defer(get_owner($aZ), () => {
		return node.remove();
	});
	follow2(flow, (value, $ba) => {
		node.textContent = value;
		return;
	}, $aY, $aZ);
}
function place4(self, parent, $aW, $aX) {
	place_text_flow(self, parent, $aW, $aX);
}
function child3(self, content, $k, $l) {
	place4(content, self, $k, $l);
	return __clone(self);
}
function child4(self, content, $k, $l) {
	place3(content, self, $k, $l);
	return __clone(self);
}
function comp(body) {
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
const scroll_fade = new5("0");
mount_root("app", ($a) => {
	return page(scroll_fade, (text) => {
		return navigator.clipboard.writeText(text);
	}, [ 1 ], $a, [ 1 ]);
});
const passive = JSON.parse("{\"passive\": true}");
const probe = document.querySelector("html");
const reduced_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const targets = document.querySelectorAll("." + class_list(reveal));
const viewport = probe.clientHeight;
let $ds = null;
if (!(reduced_motion)) {
	for (const target of targets) {
		if (target.getBoundingClientRect().top > viewport - 40.0) {
			target.style.setProperty("opacity", "0");
			target.style.setProperty("transform", "translateY(28px)");
		}
	}
	$ds = undefined;
}
$ds;
const publish = () => {
	return turn([ 1 ], ($dt) => {
		const progress = Math.max(Math.min(probe.scrollTop / 64.0, 1.0), 0.0);
		set(scroll_fade, "" + progress, [ 0, $dt ]);
		let $du = null;
		if (!(reduced_motion)) {
			const line = probe.clientHeight * 0.92;
			for (const target2 of targets) {
				if (target2.getBoundingClientRect().top < line) {
					target2.style.setProperty("transition", "opacity 600ms ease, transform 600ms ease");
					target2.style.setProperty("opacity", "1");
					target2.style.setProperty("transform", "none");
				}
			}
			$du = undefined;
		}
		return $du;
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
