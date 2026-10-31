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
function __remove_at(list, index, location) {
	if (index >= 0 && index < list.length) return list.splice(index, 1)[0];
	throw __panic("index out of bounds: the length is " + list.length + " but the index is " + index, location);
}
let __shared_identity_next = 1;
function __shared_identity(cell) {
	return cell.__id ??= __shared_identity_next++;
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
function mint_subscriber(notify3) {
	const derived = minting_derivation.v;
	minting_derivation.v = false;
	return subscriber_of(notify3, derived);
}
function subscriber_of(notify3, derived) {
	return [ fresh_id(), notify3, __shared_new(true), derived ];
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
		let $f = null;
		if (subscriber[3]) {
			if (!(turn2[3].v.has(key))) {
				turn2[3].v.set(key, true);
				if (tracing.v) {
					trace_hooks.v[3](turn2, subscriber[0]);
				}
				turn2[1].v.push(__clone(subscriber));
			}
			$f = undefined;
		} else if (!(turn2[2].v.has(key))) {
			turn2[2].v.set(key, true);
			if (tracing.v) {
				trace_hooks.v[3](turn2, subscriber[0]);
			}
			let index = turn2[0].v.length;
			while (index > 0 && __at(turn2[0].v, index - 1, "std/src/reactive.vl:421:21")[0] > subscriber[0]) {
				index = index - 1;
			}
			__insert_at(turn2[0].v, index, __clone(subscriber), "std/src/reactive.vl:424:25");
		}
		$f;
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
						if (tracing.v) {
							trace_hooks.v[4](turn2, subscriber);
						} else if (subscriber[2].v) {
							subscriber[1]();
						}
						budget = budget - 1;
					}
				}
				const wave = turn2[0].v;
				turn2[0].v = [  ];
				turn2[2].v = new Map();
				for (const subscriber2 of wave) {
					if (tracing.v) {
						trace_hooks.v[4](turn2, subscriber2);
					} else if (subscriber2[2].v) {
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
	const $ba = turn2;
	let $bb = null;
	if ($ba[0] === 0) {
		const ambient = $ba[1];
		$bb = enqueue(ambient, [ reissued(subscriber) ]);
	} else {
		const $bc = last(draining_turns.v);
		let $bd = null;
		if ($bc[0] === 0) {
			const draining = $bc[1];
			$bd = enqueue(draining, [ reissued(subscriber) ]);
		} else {
			if (subscriber[2].v) {
				subscriber[1]();
			}
			$bd = undefined;
		}
		$bb = $bd;
	}
	return $bb;
}
function reissued(subscriber) {
	return [ subscriber[0], subscriber[1], subscriber[2], subscriber[3] ];
}
function wake(subscriber) {
	if (tracing.v && trace_hooks.v[6](subscriber, last(draining_turns.v))) {
		return;
	}
	defer_subscriber([ 1 ], subscriber);
}
function queue_wakes(turn2, subscribers, traced, cause) {
	if (traced) {
		waking.v = [ 0, cause ];
		enqueue(turn2, subscribers);
		waking.v = [ 1 ];
	} else {
		enqueue(turn2, subscribers);
	}
}
function dispose(self, $bz) {
	const $bA = $bz;
	let $bB = null;
	if ($bA[0] === 0) {
		const established = $bA[1];
		$bB = [ 0, established ];
	} else {
		$bB = last(draining_turns.v);
	}
	const ambient = $bB;
	release_under(self, ambient);
}
function detach(handle) {
	const $bf = last(releasing_turns.v);
	let $bg = null;
	if ($bf[0] === 0) {
		const at_release = $bf[1];
		$bg = at_release;
	} else {
		$bg = last(draining_turns.v);
	}
	const turn2 = $bg;
	release_under(handle, turn2);
}
function release_under(handle, ambient) {
	handle[2].v = false;
	const $bh = [ 0, handle[0] ];
	let $bi = null;
	if ($bh[0] === 0) {
		const subscribers = $bh[1];
		let kept = [  ];
		for (const subscriber of subscribers.v) {
			if (subscriber[0] !== handle[1]) {
				kept.push(__clone(subscriber));
			}
		}
		subscribers.v = kept;
		$bi = undefined;
	} else {
		$bi = undefined;
	}
	$bi;
	const $bj = ambient;
	let $bk = null;
	if ($bj[0] === 0) {
		const turn2 = $bj[1];
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
		if (tracing.v) {
			trace_hooks.v[7](turn2, handle[1]);
		}
		$bk = undefined;
	} else {
		$bk = undefined;
	}
	$bk;
	const $bl = handle[3].v;
	let $bm = null;
	if ($bl[0] === 0) {
		const release = $bl[1];
		handle[3].v = [ 1 ];
		releasing_turns.v.push(ambient);
		__with_finally(release, () => {
			__list_pop(releasing_turns.v);
			return;
		});
		$bm = undefined;
	} else {
		$bm = undefined;
	}
	return $bm;
}
function new3() {
	return [ __shared_new([ 0, no_cleanups, false, [ 1 ] ]), 0 ];
}
function is_disposed(self) {
	return self[0].v[0] !== self[1];
}
function defer(self, cleanup) {
	let $aj = null;
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
		$aj = undefined;
	}
	return $aj;
}
function renew(self) {
	const $ay = self[0].v[3];
	let $az = null;
	if ($ay[0] === 0) {
		const nursery2 = __clone($ay[1]);
		let $aA = null;
		if (has_spawned(nursery2)) {
			$aA = [ 1 ];
		} else {
			$aA = [ 0, nursery2 ];
		}
		$az = $aA;
	} else {
		$az = [ 1 ];
	}
	const carried = $az;
	advance([ self[0], self[0].v[0] ], carried);
	if (is_none(self[0].v[3])) {
		run_nurseries_allocated_count.v = run_nurseries_allocated_count.v + 1;
		self[0].v[3] = [ 0, detached_nursery() ];
	}
	return [ self[0], self[0].v[0] ];
}
function nursery(self) {
	let $aL = null;
	if (is_disposed(self)) {
		$aL = [ 1 ];
	} else {
		$aL = self[0].v[3];
	}
	return $aL;
}
function dispose2(self) {
	advance(self, [ 1 ]);
}
function advance(self, carried) {
	let $aK = null;
	if (!(is_disposed(self))) {
		const held = self[0].v;
		self[0].v = [ self[1] + 1, no_cleanups, false, carried ];
		const $aB = held[3];
		let $aC = null;
		if ($aB[0] === 0) {
			const nursery2 = $aB[1];
			if (is_none(carried)) {
				nursery2.cancel();
			}
			$aC = undefined;
		} else {
			$aC = undefined;
		}
		$aC;
		let $aJ = null;
		if (held[2]) {
			let failure = [ 1 ];
			for (const cleanup of held[1].v) {
				const $aE = __guarded(cleanup);
				let $aF = null;
				if ($aE[0] === 0) {
					const message = $aE[1];
					if (is_none(failure)) {
						failure = [ 0, message ];
					}
					$aF = undefined;
				} else {
					$aF = undefined;
				}
				$aF;
			}
			const $aH = failure;
			let $aI = null;
			if ($aH[0] === 0) {
				const message2 = $aH[1];
				$aI = (() => {
					throw __panic(message2, "std/src/reactive.vl:1294:27");
				})();
			} else {
				$aI = undefined;
			}
			$aJ = $aI;
		}
		$aK = $aJ;
	}
	return $aK;
}
function get_owner($ai) {
	return $ai;
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
	const $at = tracker[0].v[6];
	let $au = null;
	if ($at[0] === 0) {
		const lists = $at[1];
		if (!(is_empty(lists.v[0]))) {
			lists.v[0] = [  ];
		}
		$au = undefined;
	} else {
		$au = undefined;
	}
	$au;
	return [ __clone(tracker), epoch ];
}
function close_run(tracker) {
	tracker[0].v[1] = false;
	const $aQ = tracker[0].v[6];
	let $aR = null;
	if ($aQ[0] === 0) {
		const lists = $aQ[1];
		$aR = lists;
	} else {
		return;
		$aR = undefined;
	}
	const lists2 = $aR;
	const $aS = tracker[0].v[5];
	let $aT = null;
	if ($aS[0] === 0) {
		const target = __clone($aS[1]);
		$aT = reconnect(tracker, lists2, target);
	} else {
		if (!(is_empty(lists2.v[0])) || !(is_empty(lists2.v[1]))) {
			lists2.v[1] = __clone(lists2.v[0]);
		}
		$aT = undefined;
	}
	$aT;
	if (!(is_empty(lists2.v[0]))) {
		lists2.v[0] = [  ];
	}
}
function reconnect(tracker, lists, target) {
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
		const $aY = reusable(held, kept, dependency[0], position);
		let $aZ = null;
		if ($aY[0] === 0) {
			const index = $aY[1];
			__at_put(kept, index, true, "std/src/reactive.vl:1711:5");
			next.push(__clone(__at(held, index, "std/src/reactive.vl:1712:15")));
			$aZ = undefined;
		} else {
			next.push([ dependency[0], dependency[1](relay_for(tracker, target)) ]);
			$aZ = undefined;
		}
		$aZ;
		position = position + 1;
	}
	lists.v[2] = next;
	let index2 = 0;
	for (const edge of held) {
		if (!(__at(kept, index2, "std/src/reactive.vl:1726:7"))) {
			detach(edge[1]);
		}
		index2 = index2 + 1;
	}
	tracker[0].v[3] = false;
}
function reusable(held, kept, identity, position) {
	const $aU = identity;
	let $aV = null;
	if ($aU[0] === 0) {
		const wanted = $aU[1];
		if (position < held.length && !(__at(kept, position, "std/src/reactive.vl:1749:9")) && same_identity(__at(held, position, "std/src/reactive.vl:1750:22")[0], wanted)) {
			return [ 0, position ];
		}
		let index = 0;
		while (index < held.length) {
			if (!(__at(kept, index, "std/src/reactive.vl:1755:9")) && same_identity(__at(held, index, "std/src/reactive.vl:1755:38")[0], wanted)) {
				return [ 0, index ];
			}
			index = index + 1;
		}
		$aV = [ 1 ];
	} else {
		$aV = [ 1 ];
	}
	return $aV;
}
function same_identity(identity, wanted) {
	const $aW = identity;
	let $aX = null;
	if ($aW[0] === 0) {
		const held = $aW[1];
		$aX = held === wanted;
	} else {
		$aX = false;
	}
	return $aX;
}
function relay_for(tracker, target) {
	return subscriber_of(() => {
		const connecting = tracker[0].v[3];
		tracker[0].v[2] = true;
		if (connecting) {
			tracker[0].v[4] = true;
		} else {
			wake(target);
		}
		return;
	}, true);
}
function attach_tracker(tracker, target) {
	tracker[0].v[5] = [ 0, __clone(target) ];
	const $bq = tracker[0].v[6];
	let $br = null;
	if ($bq[0] === 0) {
		const lists = $bq[1];
		$br = lists;
	} else {
		return;
		$br = undefined;
	}
	const lists2 = $br;
	let $bs = null;
	if (!(is_empty(lists2.v[1]))) {
		const read = __clone(lists2.v[1]);
		lists2.v[1] = [  ];
		tracker[0].v[3] = true;
		let edges = [  ];
		for (const dependency of read) {
			edges.push([ dependency[0], dependency[1](relay_for(tracker, target)) ]);
		}
		lists2.v[2] = edges;
		tracker[0].v[3] = false;
		if (tracker[0].v[4]) {
			tracker[0].v[4] = false;
			wake(target);
		}
		$bs = undefined;
	}
	return $bs;
}
function forget_reads(tracker) {
	const $bt = tracker[0].v[6];
	let $bu = null;
	if ($bt[0] === 0) {
		const lists = $bt[1];
		$bu = lists;
	} else {
		return;
		$bu = undefined;
	}
	const lists2 = $bu;
	let $bv = null;
	if (!(is_empty(lists2.v[2]))) {
		const edges = __clone(lists2.v[2]);
		lists2.v[2] = [  ];
		for (const edge of edges) {
			detach(edge[1]);
		}
		$bv = undefined;
	}
	$bv;
	if (!(is_empty(lists2.v[1]))) {
		lists2.v[1] = [  ];
	}
}
function detach_tracker(tracker) {
	tracker[0].v[5] = [ 1 ];
	forget_reads(tracker);
}
function place_subscription(subscription, site) {
	if (tracing.v) {
		trace_hooks.v[8](subscription[1], site);
	}
	return subscription;
}
function also_releasing(handle, release) {
	const previous = handle[3].v;
	handle[3].v = [ 0, () => {
		release();
		const $bw = previous;
		let $bx = null;
		if ($bw[0] === 0) {
			const earlier = $bw[1];
			$bx = earlier();
		} else {
			$bx = undefined;
		}
		return $bx;
	} ];
}
function has_spawned(self) {
	return __nursery_has_spawned(self);
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
function detached_nursery() {
	return __nursery_new_detached();
}
function clamp_delay(ms) {
	let $A = null;
	if (ms < 0) {
		$A = 0;
	} else {
		$A = ms;
	}
	return $A;
}
function after(ms) {
	return [ __timer(clamp_delay(ms)) ];
}
async function wait(self, $B) {
	return await (self[0].wait(ambient_signal($B)));
}
function cancel(self) {
	self[0].cancel();
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
			throw __panic("this style\'s slot key is not one media:condition:property triple (got \"" + key + "\"" + ") \u{2014} every field that reaches a key is fenced against \':\' where it is written, so a key holding another one means a condition token was minted carrying the key\'s own separator; that is the bug, not this read", "std/src/web/style.vl:877:3");
		})();
	}
	return [ __at(parts, 0, "std/src/web/style.vl:879:17"), __at(parts, 1, "std/src/web/style.vl:879:39"), __at(parts, 2, "std/src/web/style.vl:879:60") ];
}
function family_longhands(property) {
	const $P = property;
	let $Q = null;
	if ($P === "padding") {
		$Q = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($P === "margin") {
		$Q = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($P === "inset") {
		$Q = ";top;right;bottom;left;";
	} else if ($P === "flex") {
		$Q = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($P === "background") {
		$Q = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($P === "border") {
		$Q = border_longhands();
	} else {
		$Q = "";
	}
	return $Q;
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
		const $R = entry;
		const class2 = $R[0];
		const _declaration = $R[1];
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
		const $N = get2(b[0], key);
		let $O = null;
		if ($N[0] === 0) {
			const entry = $N[1];
			const slot = slot_of(key);
			rules = without_covered(rules, slot[0], slot[1], slot[2]);
			insert(rules, key, entry);
			$O = undefined;
		} else {
			$O = undefined;
		}
		$O;
	}
	return [ rules ];
}
function view(tag) {
	let $K = null;
	if (is_svg_tag(tag)) {
		$K = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$K = [ document.createElement(tag) ];
	}
	return $K;
}
function is_svg_tag(tag) {
	const $I = tag;
	let $J = null;
	if ($I === "svg") {
		$J = true;
	} else if ($I === "path") {
		$J = true;
	} else if ($I === "circle") {
		$J = true;
	} else if ($I === "ellipse") {
		$J = true;
	} else if ($I === "rect") {
		$J = true;
	} else if ($I === "line") {
		$J = true;
	} else if ($I === "polyline") {
		$J = true;
	} else if ($I === "polygon") {
		$J = true;
	} else if ($I === "g") {
		$J = true;
	} else if ($I === "defs") {
		$J = true;
	} else if ($I === "use") {
		$J = true;
	} else if ($I === "symbol") {
		$J = true;
	} else if ($I === "marker") {
		$J = true;
	} else if ($I === "pattern") {
		$J = true;
	} else if ($I === "mask") {
		$J = true;
	} else if ($I === "clipPath") {
		$J = true;
	} else if ($I === "linearGradient") {
		$J = true;
	} else if ($I === "radialGradient") {
		$J = true;
	} else if ($I === "stop") {
		$J = true;
	} else if ($I === "text") {
		$J = true;
	} else if ($I === "tspan") {
		$J = true;
	} else if ($I === "textPath") {
		$J = true;
	} else if ($I === "filter") {
		$J = true;
	} else if ($I === "foreignObject") {
		$J = true;
	} else if ($I === "feGaussianBlur") {
		$J = true;
	} else if ($I === "feColorMatrix") {
		$J = true;
	} else if ($I === "feOffset") {
		$J = true;
	} else if ($I === "feMerge") {
		$J = true;
	} else if ($I === "feMergeNode") {
		$J = true;
	} else if ($I === "feFlood") {
		$J = true;
	} else if ($I === "feComposite") {
		$J = true;
	} else if ($I === "feBlend") {
		$J = true;
	} else if ($I === "feDropShadow") {
		$J = true;
	} else {
		$J = false;
	}
	return $J;
}
function styled(self, style) {
	self[0].setAttribute("class", class_list(style));
	return __clone(self);
}
function on(self, event, handler) {
	self[0].addEventListener(event, () => {
		return turn([ 1 ], ($Y) => {
			return (() => {
				return handler($Y, [ 1 ]);
			})();
		});
	});
	return __clone(self);
}
function open(parent) {
	const anchor = document.createTextNode("");
	parent[0].appendChild(anchor);
	return [ anchor, __shared_new([  ]), __shared_new([  ]) ];
}
function host(self) {
	return self[0].parentNode;
}
function cut_row(self, row, end) {
	const range = document.createRange();
	range.setStartAfter(row[0]);
	range.setEndBefore(end);
	return range.extractContents();
}
function insert_row(self, row, content, end) {
	host(self).insertBefore(row[0], end);
	host(self).insertBefore(content, end);
}
function drop_row(self, row) {
	row[0].remove();
}
function hold_rows(self, rows) {
	self[2].v = __clone(rows);
}
function close(self) {
	for (const view2 of self[1].v) {
		view2[0].remove();
	}
	self[1].v = [  ];
	const rows = __clone(self[2].v);
	let at = 0;
	for (const row of rows) {
		let $cB = null;
		if (at + 1 < rows.length) {
			$cB = __at(rows, at + 1, "std/src/browser/web/ui.vl:866:39")[0];
		} else {
			$cB = self[0];
		}
		const end = __clone($cB);
		cut_row(self, row, end);
		drop_row(self, row);
		at = at + 1;
	}
	self[2].v = [  ];
	self[0].remove();
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
function settled_steps(steps) {
	let forward = [  ];
	let forward_count = 0;
	let highest = [ 1 ];
	for (const step of steps) {
		const $cM = step;
		let $cN = null;
		if ($cM[0] === 0) {
			const index = $cM[1];
			const $cO = highest;
			let $cP = null;
			if ($cO[0] === 0) {
				const top = $cO[1];
				$cP = index > top;
			} else {
				$cP = true;
			}
			const rises = $cP;
			if (rises) {
				highest = [ 0, index ];
				forward_count = forward_count + 1;
				forward.push(true);
			} else {
				forward.push(false);
			}
			$cN = undefined;
		} else {
			forward.push(false);
			$cN = undefined;
		}
		$cN;
	}
	let backward = [  ];
	let backward_count = 0;
	let lowest = steps.length;
	let at = steps.length;
	while (at > 0) {
		at = at - 1;
		const $cQ = __at(steps, at, "std/src/browser/web/ui.vl:1529:9");
		let $cR = null;
		if ($cQ[0] === 0) {
			const index2 = $cQ[1];
			if (index2 < lowest) {
				lowest = index2;
				backward_count = backward_count + 1;
				backward.push(true);
			} else {
				backward.push(false);
			}
			$cR = undefined;
		} else {
			backward.push(false);
			$cR = undefined;
		}
		$cR;
	}
	let $cS = null;
	if (forward_count >= backward_count) {
		$cS = forward;
	} else {
		$cS = reverse(backward);
	}
	return $cS;
}
function row_references(steps, rows, settled, anchor) {
	let references = [  ];
	let reference = __clone(anchor);
	let at = steps.length;
	while (at > 0) {
		at = at - 1;
		references.push(__clone(reference));
		let $cV = null;
		if (__at(settled, at, "std/src/browser/web/ui.vl:1621:6")) {
			const $cT = __at(steps, at, "std/src/browser/web/ui.vl:1622:10");
			let $cU = null;
			if ($cT[0] === 0) {
				const index = $cT[1];
				reference = __clone(__at(rows, index, "std/src/browser/web/ui.vl:1624:18")[0]);
				$cU = undefined;
			} else {
				$cU = undefined;
			}
			$cV = $cU;
		}
		$cV;
	}
	return reverse(references);
}
function apply(self, parent, name) {
	parent[0].setAttribute(name, self);
}
function mount_target(id) {
	const element = document.getElementById(id);
	if (__is_null(element)) {
		(() => {
			throw __panic("mount: no element with id \'" + id + "\'", "std/src/browser/web/ui.vl:2386:3");
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
	const $eF = turn([ 1 ], ($eE) => {
		return comp(body);
	});
	const built = $eF[0];
	const root = $eF[1];
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
function template_option(value, label, $bH, $bI) {
	return child2(attr(view("option"), "value", value, $bH, $bI), label, $bH, $bI);
}
function template_title(name) {
	const $bU = name;
	let $bV = null;
	if ($bU === "counter") {
		$bV = "Counter";
	} else if ($bU === "hello") {
		$bV = "Hello";
	} else if ($bU === "styles") {
		$bV = "Styles";
	} else if ($bU === "server") {
		$bV = "Server";
	} else {
		$bV = name;
	}
	return $bV;
}
function severity_tag(row, $co, $cp) {
	const $cq = row[1];
	let $cr = null;
	if ($cq === "error") {
		$cr = child2(styled(view("span"), diag_error), "error", $co, $cp);
	} else {
		$cr = child2(styled(view("span"), diag_warning), "warning", $co, $cp);
	}
	return $cr;
}
function trace_row(hop, $cs, $ct) {
	let $cu = null;
	if (hop[4]) {
		$cu = "  via " + hop[0] + ":" + hop[1] + ":" + hop[2] + " \u{2014} " + hop[3];
	} else {
		$cu = "  " + hop[3];
	}
	const text = $cu;
	return child2(styled(view("div"), diag_trace), text, $cs, $ct);
}
function diagnostic_row(row, $cm, $cn) {
	const head = child(child(child(view("div"), severity_tag(row, $cm, $cn), $cm, $cn), child2(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " ", $cm, $cn), $cm, $cn), child2(view("span"), row[5], $cm, $cn), $cm, $cn);
	let lines = [ head ];
	for (const hop of row[7]) {
		lines.push(trace_row(hop, $cm, $cn));
	}
	if (row[6] !== "") {
		lines.push(child2(styled(view("div"), diag_note), "  note: " + row[6], $cm, $cn));
	}
	const body = child5(view("div"), lines, $cm, $cn);
	const $cv = row[1];
	let $cw = null;
	if ($cv === "error") {
		$cw = child(styled(view("div"), diag_row_error), body, $cm, $cn);
	} else {
		$cw = child(styled(view("div"), diag_row_warning), body, $cm, $cn);
	}
	return $cw;
}
function console_row(row, $dK, $dL) {
	const $dM = row[1];
	let $dN = null;
	if ($dM === "error") {
		$dN = child2(styled(view("div"), console_error), row[2], $dK, $dL);
	} else {
		$dN = child2(styled(view("div"), console_line), row[2], $dK, $dL);
	}
	return $dN;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, can_prelude2, share_label2, mode2, modified_from2, confirm_target2, run2, format2, share2, confirm_replace2, cancel_replace2, $G, $H) {
	return child(child(styled(view("div"), add(add(shell, app_fill), code_palette)), child(child(child(child(child(child(child(child(child(child(child(child(styled(view("header"), app_bar), child(child(attr(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $G, $H), attr(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $G, $H), $G, $H), child2(view("span"), "VILAN", $G, $H), $G, $H), $G, $H), child2(styled(view("h1"), page_title), "Playground", $G, $H), $G, $H), styled(view("div"), rail_divider), $G, $H), child3(on(styled(view("button"), primary_button), "click", ($W, $X) => {
		return run2();
	}), derive(__clone(mode2), (current, $Z, $aa, $ab) => {
		const $ac = current;
		let $ad = null;
		if ($ac === "node") {
			$ad = "Check";
		} else {
			$ad = "Run";
		}
		return $ad;
	}), $G, $H), $G, $H), child(child(show(attr(attr(styled(view("select"), select_box), "id", "mode", $G, $H), "aria-label", "Compile mode", $G, $H), __clone(can_platform2), $G, $H), template_option("browser", "Browser: compile and run", $G, $H), $G, $H), template_option("node", "Server: check the process leg", $G, $H), $G, $H), $G, $H), child(child(child(show(attr(attr(styled(view("select"), select_box), "id", "prelude", $G, $H), "aria-label", "Ambient scope", $G, $H), __clone(can_prelude2), $G, $H), template_option("on", "Prelude: on", $G, $H), $G, $H), template_option("web", "Prelude: web", $G, $H), $G, $H), template_option("off", "Prelude: off", $G, $H), $G, $H), $G, $H), child2(show(on(styled(view("button"), ghost_button), "click", ($bJ, $bK) => {
		return format2();
	}), __clone(can_format2), $G, $H), "Format", $G, $H), $G, $H), child4(on(styled(view("button"), ghost_button), "click", ($bL, $bM) => {
		return share2();
	}), __clone(share_label2), $G, $H), $G, $H), child4(attr(styled(view("p"), status_line), "role", "status", $G, $H), __clone(status2), $G, $H), $G, $H), attr(attr(styled(view("select"), version_select), "id", "version", $G, $H), "aria-label", "Compiler version", $G, $H), $G, $H), styled(view("div"), rail_divider), $G, $H), child2(attr(styled(view("a"), nav_link), "href", "/docs/", $G, $H), "Docs", $G, $H), $G, $H), $G, $H), child(child(child(child(styled(view("main"), quad_grid), child(child(child(styled(view("div"), panel), child(child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Program", $G, $H), $G, $H), child(child(child(child(child(attr(attr(styled(view("select"), select_box), "id", "template", $G, $H), "aria-label", "Load an example", $G, $H), child3(attr(attr(attr(view("option"), "disabled", "true", $G, $H), "hidden", "true", $G, $H), "value", "", $G, $H), derive(__clone(modified_from2), (name, $bP, $bQ, $bR) => {
		const $bS = name;
		let $bT = null;
		if ($bS === "") {
			$bT = "Examples";
		} else {
			$bT = "Modified \u{2014} " + template_title(name);
		}
		return $bT;
	}), $G, $H), $G, $H), template_option("counter", "Counter: reactive state", $G, $H), $G, $H), template_option("hello", "Hello: mount and print", $G, $H), $G, $H), template_option("styles", "Styles: compile-time CSS", $G, $H), $G, $H), show(template_option("server", "Server: typed HTTP, checked", $G, $H), __clone(can_platform2), $G, $H), $G, $H), $G, $H), $G, $H), child(show2(attr(view("div"), "role", "alert", $G, $H), derive(__clone(confirm_target2), (name, $bW, $bX, $bY) => {
		return name !== "";
	}), $G, $H), child(child(child(styled(view("div"), confirm_bar), child3(styled(view("p"), confirm_question), derive(__clone(confirm_target2), (name, $cb, $cc, $cd) => {
		return "Replace the current program with " + template_title(name) + "? The edits are not kept.";
	}), $G, $H), $G, $H), child2(on(styled(view("button"), ghost_button), "click", ($ce, $cf) => {
		return cancel_replace2();
	}), "Keep editing", $G, $H), $G, $H), child2(on(styled(view("button"), primary_button), "click", ($cg, $ch) => {
		return confirm_replace2();
	}), "Replace", $G, $H), $G, $H), $G, $H), $G, $H), attr(attr(styled(view("div"), editor_host), "id", "editor", $G, $H), "aria-label", "Program editor", $G, $H), $G, $H), $G, $H), child(child(styled(view("div"), panel), child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Result", $G, $H), $G, $H), $G, $H), attr(attr(styled(view("div"), runner_host), "id", "runner", $G, $H), "aria-label", "Program result", $G, $H), $G, $H), $G, $H), child(child(styled(view("div"), panel), child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Diagnostics", $G, $H), $G, $H), $G, $H), child6(child(styled(view("pre"), report_well), child2(show3(styled(view("div"), quiet_row), derive(__clone(diagnostics2), (rows, $ci, $cj, $ck) => {
		return rows.length === 0;
	}), $G, $H), "Nothing to report.", $G, $H), $G, $H), each_by(__clone(diagnostics2), (row) => {
		return row[0];
	}, (row, $cl) => {
		return diagnostic_row(get(row), $G, $cl);
	}), $G, $H), $G, $H), $G, $H), child(child(styled(view("div"), panel), child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Console", $G, $H), $G, $H), $G, $H), child7(child(styled(view("pre"), report_well), child2(show4(styled(view("div"), quiet_row), derive(__clone(console_lines2), (rows, $dG, $dH, $dI) => {
		return rows.length === 0;
	}), $G, $H), "Program output lands here.", $G, $H), $G, $H), each_by(__clone(console_lines2), (row) => {
		return row[0];
	}, (row, $dJ) => {
		return console_row(get(row), $G, $dJ);
	}), $G, $H), $G, $H), $G, $H), $G, $H);
}
function new4(value, caller) {
	let subscribers = [  ];
	const cell = [ __shared_new(value), __shared_new(subscribers) ];
	if (tracing.v) {
		trace_hooks.v[0](__shared_identity(cell[0]), caller);
	}
	return cell;
}
function new5(value, caller) {
	return new4(value, caller);
}
function new6(value, caller) {
	return new4(value, caller);
}
function is_empty(self) {
	return self.length === 0;
}
function last(self) {
	let $g = null;
	if (is_empty(self)) {
		$g = [ 1 ];
	} else {
		$g = __list_get(self, self.length - 1);
	}
	return $g;
}
function notify(self, $b) {
	const traced = tracing.v;
	let $c = null;
	if (traced) {
		$c = trace_hooks.v[2](__shared_identity(self[0]));
	} else {
		$c = "";
	}
	const cause = $c;
	const $d = $b;
	let $e = null;
	if ($d[0] === 0) {
		const turn2 = $d[1];
		$e = queue_wakes(turn2, __clone(self[1].v), traced, cause);
	} else {
		const $h = last(draining_turns.v);
		let $i = null;
		if ($h[0] === 0) {
			const draining = $h[1];
			$i = queue_wakes(draining, __clone(self[1].v), traced, cause);
		} else {
			for (const subscriber of __clone(self[1].v)) {
				let $j = null;
				if (subscriber[2].v) {
					if (traced) {
						trace_hooks.v[5](subscriber, cause);
					} else {
						subscriber[1]();
					}
					$j = undefined;
				}
				$j;
			}
			$i = undefined;
		}
		$e = $i;
	}
	return $e;
}
function set(self, value, $a, caller) {
	if (tracing.v) {
		trace_hooks.v[1](caller);
	}
	self[0].v = __clone(value);
	notify(self, $a);
}
function notify2(self, $b) {
	const traced = tracing.v;
	let $m = null;
	if (traced) {
		$m = trace_hooks.v[2](__shared_identity(self[0]));
	} else {
		$m = "";
	}
	const cause = $m;
	const $n = $b;
	let $o = null;
	if ($n[0] === 0) {
		const turn2 = $n[1];
		$o = queue_wakes(turn2, __clone(self[1].v), traced, cause);
	} else {
		const $p = last(draining_turns.v);
		let $q = null;
		if ($p[0] === 0) {
			const draining = $p[1];
			$q = queue_wakes(draining, __clone(self[1].v), traced, cause);
		} else {
			for (const subscriber of __clone(self[1].v)) {
				let $r = null;
				if (subscriber[2].v) {
					if (traced) {
						trace_hooks.v[5](subscriber, cause);
					} else {
						subscriber[1]();
					}
					$r = undefined;
				}
				$r;
			}
			$q = undefined;
		}
		$o = $q;
	}
	return $o;
}
function set2(self, value, $a, caller) {
	if (tracing.v) {
		trace_hooks.v[1](caller);
	}
	self[0].v = __clone(value);
	notify2(self, $a);
}
function set3(self, value, $a, caller) {
	if (tracing.v) {
		trace_hooks.v[1](caller);
	}
	self[0].v = __clone(value);
	notify2(self, $a);
}
function get(self) {
	return __clone(self[0].v);
}
function keys(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[0]));
	}
	return result;
}
function get2(self, key) {
	const $L = __map_get(self[0], hash(key));
	let $M = null;
	if ($L[0] === 0) {
		const entry = $L[1];
		$M = [ 0, __clone(entry.slice(1, 3)) ];
	} else {
		$M = [ 1 ];
	}
	return $M;
}
function remove(self, key) {
	self[0].delete(hash(key));
}
function insert(self, key, value) {
	self[0].set(hash(key), [ __clone(key), ...__clone(value) ]);
}
function values(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry.slice(1, 3)));
	}
	return result;
}
function attr(self, name, value, $S, $T) {
	apply(value, self, name, $S, $T);
	return __clone(self);
}
function child(self, content, $U, $V) {
	place(content, self, $U, $V);
	return __clone(self);
}
function child2(self, content, $U, $V) {
	place2(content, self, $U, $V);
	return __clone(self);
}
function turn(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[5].v = true;
	return result;
}
function derive(self, transform) {
	return [ self, transform ];
}
function attach(signal, subscriber) {
	const handle = [ signal[1], subscriber[0], subscriber[2], __shared_new([ 1 ]) ];
	signal[1].v.push(reissued(subscriber));
	return handle;
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
	const $aD = self;
	return $aD[0] === 1;
}
function run_body(runs, body) {
	const run2 = renew(runs);
	const $aM = nursery(run2);
	let $aN = null;
	if ($aM[0] === 0) {
		const nursery2 = $aM[1];
		$aN = (($aO) => {
			return (($aP) => {
				return body($aO, $aP);
			})(nursery2);
		})(run2);
	} else {
		$aN = (() => {
			throw __panic("a renewed run carries its nursery", "std/src/reactive.vl:1405:11");
		})();
	}
	return $aN;
}
function run_once(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = run_body(runs, ($av, $aw) => {
		return (($ax) => {
			return body($av, $ax, $aw);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function run_tracked(runs, tracker, body) {
	let value = run_once(runs, tracker, ($aq, $ar, $as) => {
		return body($aq, $ar, $as);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = run_once(runs, tracker, ($bn, $bo, $bp) => {
			return body($bn, $bo, $bp);
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
		return run_tracked(runs, tracker, ($an, $ao, $ap) => {
			return transform(value, $an, $ao, $ap);
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
function observe_flow(flow, observer, immediately, caller) {
	const instance = start2(flow);
	const pull = instance[0];
	if (!(immediately)) {
		pull();
	}
	const subscriber = mint_subscriber(() => {
		return observer(pull());
	});
	if (tracing.v) {
		trace_hooks.v[8](subscriber[0], caller);
	}
	const subscription = instance[1](subscriber);
	also_releasing(subscription, instance[2]);
	if (immediately) {
		observer(pull());
	}
	return subscription;
}
function sub(self, observer, caller) {
	return observe_flow(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true, caller);
}
function take(self, item, $by) {
	defer(self, () => {
		dispose(item, $by);
		return;
	});
	return __clone(item);
}
function follow(flow, observer, $al, $am) {
	take(get_owner($am), sub(flow, observer, "std/src/browser/web/ui.vl:87:24"), $al);
}
function place_text_flow(flow, parent, $ag, $ah) {
	const node = document.createTextNode("");
	parent[0].appendChild(node);
	defer(get_owner($ah), () => {
		return node.remove();
	});
	follow(flow, (value, $ak) => {
		node.textContent = value;
		return;
	}, $ag, $ah);
}
function place4(self, parent, $ae, $af) {
	place_text_flow(self, parent, $ae, $af);
}
function child3(self, content, $U, $V) {
	place4(content, self, $U, $V);
	return __clone(self);
}
function observe(signal, observer) {
	const cell = signal[0];
	return attach(signal, mint_subscriber(() => {
		const $bF = [ 0, cell ];
		let $bG = null;
		if ($bF[0] === 0) {
			const live = $bF[1];
			$bG = observer(live.v);
		} else {
			$bG = undefined;
		}
		return $bG;
	}));
}
function attach_observer(self, observer, immediately) {
	const subscription = observe(self, observer);
	if (immediately) {
		observer(get(self));
	}
	return subscription;
}
function sub2(self, observer, caller) {
	return place_subscription(attach_observer(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true), caller);
}
function follow2(flow, observer, $al, $am) {
	take(get_owner($am), sub2(flow, observer, "std/src/browser/web/ui.vl:87:24"), $al);
}
function show(self, condition, $bC, $bD) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	follow2(condition, (visible, $bE) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $bC, $bD);
	return __clone(self);
}
function attach_observer2(self, observer, immediately) {
	const subscription = observe(self, observer);
	if (immediately) {
		observer(get(self));
	}
	return subscription;
}
function sub3(self, observer, caller) {
	return place_subscription(attach_observer2(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true), caller);
}
function follow3(flow, observer, $al, $am) {
	take(get_owner($am), sub3(flow, observer, "std/src/browser/web/ui.vl:87:24"), $al);
}
function place_text_flow2(flow, parent, $ag, $ah) {
	const node = document.createTextNode("");
	parent[0].appendChild(node);
	defer(get_owner($ah), () => {
		return node.remove();
	});
	follow3(flow, (value, $ak) => {
		node.textContent = value;
		return;
	}, $ag, $ah);
}
function place5(self, parent, $ae, $af) {
	place_text_flow2(self, parent, $ae, $af);
}
function child4(self, content, $U, $V) {
	place5(content, self, $U, $V);
	return __clone(self);
}
function run_body2(runs, body) {
	const run2 = renew(runs);
	const $bZ = nursery(run2);
	let $ca = null;
	if ($bZ[0] === 0) {
		const nursery2 = $bZ[1];
		$ca = (($aO) => {
			return (($aP) => {
				return body($aO, $aP);
			})(nursery2);
		})(run2);
	} else {
		$ca = (() => {
			throw __panic("a renewed run carries its nursery", "std/src/reactive.vl:1405:11");
		})();
	}
	return $ca;
}
function run_once2(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = run_body2(runs, ($av, $aw) => {
		return (($ax) => {
			return body($av, $ax, $aw);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function run_tracked2(runs, tracker, body) {
	let value = run_once2(runs, tracker, ($aq, $ar, $as) => {
		return body($aq, $ar, $as);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = run_once2(runs, tracker, ($bn, $bo, $bp) => {
			return body($bn, $bo, $bp);
		});
		rounds = rounds + 1;
	}
	if (tracker[0].v[4]) {
		tracker[0].v[4] = false;
	}
	return value;
}
function start3(self) {
	const transform = self[1];
	const upstream = start(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return run_tracked2(runs, tracker, ($an, $ao, $ap) => {
			return transform(value, $an, $ao, $ap);
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
function observe_flow2(flow, observer, immediately, caller) {
	const instance = start3(flow);
	const pull = instance[0];
	if (!(immediately)) {
		pull();
	}
	const subscriber = mint_subscriber(() => {
		return observer(pull());
	});
	if (tracing.v) {
		trace_hooks.v[8](subscriber[0], caller);
	}
	const subscription = instance[1](subscriber);
	also_releasing(subscription, instance[2]);
	if (immediately) {
		observer(pull());
	}
	return subscription;
}
function sub4(self, observer, caller) {
	return observe_flow2(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true, caller);
}
function follow4(flow, observer, $al, $am) {
	take(get_owner($am), sub4(flow, observer, "std/src/browser/web/ui.vl:87:24"), $al);
}
function show2(self, condition, $bC, $bD) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	follow4(condition, (visible, $bE) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $bC, $bD);
	return __clone(self);
}
function on_settle2(self, subscriber) {
	return attach(self, subscriber);
}
function start4(self) {
	return [ () => {
		return get(self);
	}, (subscriber) => {
		return on_settle2(self, subscriber);
	}, () => {
		return;
	} ];
}
function start5(self) {
	const transform = self[1];
	const upstream = start4(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return run_tracked2(runs, tracker, ($an, $ao, $ap) => {
			return transform(value, $an, $ao, $ap);
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
function observe_flow3(flow, observer, immediately, caller) {
	const instance = start5(flow);
	const pull = instance[0];
	if (!(immediately)) {
		pull();
	}
	const subscriber = mint_subscriber(() => {
		return observer(pull());
	});
	if (tracing.v) {
		trace_hooks.v[8](subscriber[0], caller);
	}
	const subscription = instance[1](subscriber);
	also_releasing(subscription, instance[2]);
	if (immediately) {
		observer(pull());
	}
	return subscription;
}
function sub5(self, observer, caller) {
	return observe_flow3(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true, caller);
}
function follow5(flow, observer, $al, $am) {
	take(get_owner($am), sub5(flow, observer, "std/src/browser/web/ui.vl:87:24"), $al);
}
function show3(self, condition, $bC, $bD) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	follow5(condition, (visible, $bE) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $bC, $bD);
	return __clone(self);
}
function child5(self, content, $U, $V) {
	place3(content, self, $U, $V);
	return __clone(self);
}
function each_by(source, key, render) {
	return [ source, key, render ];
}
function held_span(held, at, count) {
	if (at === 0 && count === held.v.length) {
		const run2 = __clone(held.v);
		return run2;
	}
	let span = [  ];
	let index = at;
	while (index < at + count) {
		span.push(__clone(__at(held.v, index, "std/src/browser/web/ui.vl:1564:13")));
		index = index + 1;
	}
	return span;
}
function reconcile(old_keys, old_items, items, key_of, same) {
	let claimed = [  ];
	for (const _ of old_keys) {
		claimed.push(false);
	}
	const held = old_keys.length;
	let first = new Map();
	let next_same = [  ];
	for (const _ of old_keys) {
		next_same.push([ 1 ]);
	}
	let build = held;
	while (build > 0) {
		build = build - 1;
		const canonical = hash2(__at(old_keys, build, "std/src/reactive.vl:3863:19"));
		__at_put(next_same, build, __map_get(first, canonical), "std/src/reactive.vl:3864:3");
		first.set(canonical, build);
	}
	let steps = [  ];
	for (const item of items) {
		const item_key = key_of(item);
		const canonical2 = hash2(item_key);
		let head = __map_get(first, canonical2);
		let advancing = true;
		while (advancing) {
			const $cD = head;
			let $cE = null;
			if ($cD[0] === 0) {
				const at = $cD[1];
				if (__at(claimed, at, "std/src/reactive.vl:3880:9")) {
					head = __at(next_same, at, "std/src/reactive.vl:3881:14");
				} else {
					advancing = false;
				}
				$cE = undefined;
			} else {
				$cE = advancing = false;
			}
			$cE;
		}
		const $cF = head;
		let $cG = null;
		if ($cF[0] === 0) {
			const at2 = $cF[1];
			$cG = first.set(canonical2, at2);
		} else {
			$cG = first.delete(canonical2);
		}
		$cG;
		let found = [ 1 ];
		let walk = head;
		let walking = true;
		while (walking) {
			const $cH = walk;
			let $cI = null;
			if ($cH[0] === 0) {
				const at3 = $cH[1];
				if (!(__at(claimed, at3, "std/src/reactive.vl:3899:10")) && __at(old_keys, at3, "std/src/reactive.vl:3899:25") === item_key) {
					found = [ 0, at3 ];
					walking = false;
				} else {
					walk = __at(next_same, at3, "std/src/reactive.vl:3906:14");
				}
				$cI = undefined;
			} else {
				$cI = walking = false;
			}
			$cI;
		}
		let step = [ 2 ];
		const $cJ = found;
		if ($cJ[0] === 0) {
			__at_put(claimed, $cJ[1], true, "std/src/reactive.vl:3914:4");
			let $cK = null;
			if (same(__at(old_items, $cJ[1], "std/src/reactive.vl:3915:19"), item)) {
				$cK = [ 0, $cJ[1] ];
			} else {
				$cK = [ 1, $cJ[1] ];
			}
			step = $cK;
		}
		steps.push(step);
	}
	let removed = [  ];
	let index = 0;
	while (index < held) {
		if (!(__at(claimed, index, "std/src/reactive.vl:3922:7"))) {
			removed.push(index);
		}
		index = index + 1;
	}
	return [ steps, removed ];
}
function reverse(self) {
	let result = [  ];
	let index = self.length;
	while (index > 0) {
		index = index - 1;
		result.push(__clone(__at(self, index, "std/src/list.vl:98:16")));
	}
	return result;
}
function open_row_before(self, content, end, $dn, $do) {
	const marker = document.createTextNode("");
	host(self).insertBefore(marker, end);
	const staging = document.createDocumentFragment();
	place(content, [ __clone(staging) ], $dn, $do);
	host(self).insertBefore(staging, end);
	return [ marker ];
}
function run_with_owner(owner, body) {
	return body(owner);
}
function delta_cursor(self) {
	return [ 1 ];
}
function delta_since(self, cursor) {
	let none = [  ];
	return none;
}
function drop_delta_cursor(self, cursor) {

}
function open_rows(self) {
	const $dt = delta_cursor(self);
	let $du = null;
	if ($dt[0] === 0) {
		const cursor = $dt[1];
		$du = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return delta_since(self, cursor);
		}, () => {
			return drop_delta_cursor(self, cursor);
		} ];
	} else {
		$du = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return [ [ 2, get(self) ] ];
		}, () => {
			return;
		} ];
	}
	return $du;
}
function live_ops(ops) {
	let last2 = [ 1 ];
	let index = 0;
	for (const op of ops) {
		const $dv = op;
		let $dw = null;
		if ($dv[0] === 2) {
			const _items = $dv[1];
			last2 = [ 0, index ];
			$dw = undefined;
		} else {
			$dw = undefined;
		}
		$dw;
		index = index + 1;
	}
	const $dx = last2;
	let $dy = null;
	if ($dx[0] === 0 && $dx[1] > 0) {
		$dy = $dx[1];
	} else {
		return __clone(ops);
	}
	const from = $dy;
	let live = [  ];
	index = from;
	while (index < ops.length) {
		live.push(__at(ops, index, "std/src/browser/web/ui.vl:1596:13"));
		index = index + 1;
	}
	return live;
}
function place_each_by(parent, source, key, render, $cz, $cA) {
	const region = open(parent);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_cells = __shared_new([  ]);
	const row_rows = region[2];
	const row_owners = __shared_new([  ]);
	defer(get_owner($cA), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		close(region);
		return;
	});
	const reconcile_span = (at, count, list) => {
		const whole = at === 0 && count === row_rows.v.length;
		const previous_cells = held_span(row_cells, at, count);
		const previous_rows = held_span(row_rows, at, count);
		const previous_owners = held_span(row_owners, at, count);
		let $cC = null;
		if (at + count < row_rows.v.length) {
			$cC = __at(row_rows.v, at + count, "std/src/browser/web/ui.vl:1992:4")[0];
		} else {
			$cC = region[0];
		}
		const boundary = __clone($cC);
		const same = (_before, _after) => {
			return true;
		};
		let $cL = null;
		if (whole) {
			$cL = reconcile(__clone(row_keys.v), __clone(row_items.v), list, key, same);
		} else {
			$cL = reconcile(held_span(row_keys, at, count), held_span(row_items, at, count), list, key, same);
		}
		const plan = $cL;
		const settled = settled_steps(plan[0]);
		const references = row_references(plan[0], previous_rows, settled, boundary);
		let staying = [  ];
		let fill = 0;
		while (fill < previous_rows.length) {
			staying.push(false);
			fill = fill + 1;
		}
		let settled_at = 0;
		for (const step of plan[0]) {
			let $cY = null;
			if (__at(settled, settled_at, "std/src/browser/web/ui.vl:2023:7")) {
				const $cW = step;
				let $cX = null;
				if ($cW[0] === 0) {
					const index = $cW[1];
					__at_put(staying, index, true, "std/src/browser/web/ui.vl:2026:7");
					$cX = undefined;
				} else {
					$cX = undefined;
				}
				$cY = $cX;
			}
			$cY;
			settled_at = settled_at + 1;
		}
		let cut = [  ];
		let index2 = 0;
		for (const row of previous_rows) {
			if (__at(staying, index2, "std/src/browser/web/ui.vl:2038:7")) {
				cut.push([ 1 ]);
			} else {
				let $cZ = null;
				if (index2 + 1 < previous_rows.length) {
					$cZ = __at(previous_rows, index2 + 1, "std/src/browser/web/ui.vl:2042:6")[0];
				} else {
					$cZ = boundary;
				}
				const end = __clone($cZ);
				cut.push([ 0, cut_row(region, row, end) ]);
			}
			index2 = index2 + 1;
		}
		for (const gone of plan[1]) {
			dispose2(__at(previous_owners, gone, "std/src/browser/web/ui.vl:2051:4"));
			drop_row(region, __at(previous_rows, gone, "std/src/browser/web/ui.vl:2052:20"));
		}
		let next_cells = [  ];
		let next_rows = [  ];
		let next_owners = [  ];
		let position = 0;
		for (const step2 of plan[0]) {
			const item = __clone(__at(list, position, "std/src/browser/web/ui.vl:2059:15"));
			const reference = __clone(__at(references, position, "std/src/browser/web/ui.vl:2060:20"));
			const $da = step2;
			let $db = null;
			if ($da[0] === 0) {
				const kept = $da[1];
				const cell = __clone(__at(previous_cells, kept, "std/src/browser/web/ui.vl:2063:17"));
				set3(cell, item, $cz, "std/src/browser/web/ui.vl:2064:11");
				next_cells.push(cell);
				const $di = __at(cut, kept, "std/src/browser/web/ui.vl:2066:12");
				let $dj = null;
				if ($di[0] === 0) {
					const content = __clone($di[1]);
					insert_row(region, __at(previous_rows, kept, "std/src/browser/web/ui.vl:2068:26"), content, reference);
					$dj = undefined;
				} else {
					$dj = undefined;
				}
				$dj;
				next_rows.push(__clone(__at(previous_rows, kept, "std/src/browser/web/ui.vl:2072:21")));
				next_owners.push(__clone(__at(previous_owners, kept, "std/src/browser/web/ui.vl:2073:23")));
				$db = undefined;
			} else if ($da[0] === 1) {
				const kept2 = $da[1];
				const cell2 = __clone(__at(previous_cells, kept2, "std/src/browser/web/ui.vl:2079:17"));
				set3(cell2, item, $cz, "std/src/browser/web/ui.vl:2080:11");
				next_cells.push(cell2);
				const $dk = __at(cut, kept2, "std/src/browser/web/ui.vl:2082:12");
				let $dl = null;
				if ($dk[0] === 0) {
					const content2 = __clone($dk[1]);
					insert_row(region, __at(previous_rows, kept2, "std/src/browser/web/ui.vl:2084:26"), content2, reference);
					$dl = undefined;
				} else {
					$dl = undefined;
				}
				$dl;
				next_rows.push(__clone(__at(previous_rows, kept2, "std/src/browser/web/ui.vl:2088:21")));
				next_owners.push(__clone(__at(previous_owners, kept2, "std/src/browser/web/ui.vl:2089:23")));
				$db = undefined;
			} else {
				const cell3 = new4(item, "std/src/browser/web/ui.vl:2092:44");
				const owner = new3();
				next_cells.push(__clone(cell3));
				next_rows.push(run_with_owner(owner, ($dm) => {
					return open_row_before(region, render(cell3, $dm), reference, $cz, $dm);
				}));
				next_owners.push(owner);
				$db = undefined;
			}
			$db;
			position = position + 1;
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		let $dp = null;
		if (whole) {
			hold_rows(region, next_rows);
			row_keys.v = next_keys;
			row_items.v = __clone(list);
			row_cells.v = next_cells;
			row_owners.v = next_owners;
		} else {
			let taken = 0;
			while (taken < count) {
				__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2120:33");
				__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2121:37");
				__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2122:35");
				__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2123:33");
				__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2124:35");
				taken = taken + 1;
			}
			let offset = 0;
			while (offset < next_rows.length) {
				__insert_at(row_rows.v, at + offset, __clone(__at(next_rows, offset, "std/src/browser/web/ui.vl:2129:42")), "std/src/browser/web/ui.vl:2129:22");
				__insert_at(row_owners.v, at + offset, __clone(__at(next_owners, offset, "std/src/browser/web/ui.vl:2130:44")), "std/src/browser/web/ui.vl:2130:24");
				__insert_at(row_cells.v, at + offset, __clone(__at(next_cells, offset, "std/src/browser/web/ui.vl:2131:43")), "std/src/browser/web/ui.vl:2131:23");
				__insert_at(row_keys.v, at + offset, __clone(__at(next_keys, offset, "std/src/browser/web/ui.vl:2132:42")), "std/src/browser/web/ui.vl:2132:22");
				__insert_at(row_items.v, at + offset, __clone(__at(list, offset, "std/src/browser/web/ui.vl:2133:43")), "std/src/browser/web/ui.vl:2133:23");
				offset = offset + 1;
			}
			$dp = undefined;
		}
		return $dp;
	};
	const reconcile_pass = (list) => {
		return reconcile_span(0, row_rows.v.length, list);
	};
	const splice_rows = (at, removed, inserted) => {
		let taken = 0;
		while (taken < removed) {
			let $dq = null;
			if (at + 1 < row_rows.v.length) {
				$dq = __at(row_rows.v, at + 1, "std/src/browser/web/ui.vl:2148:5")[0];
			} else {
				$dq = region[0];
			}
			const end = __clone($dq);
			const going = __clone(__at(row_rows.v, at, "std/src/browser/web/ui.vl:2152:16"));
			cut_row(region, going, end);
			dispose2(__at(row_owners.v, at, "std/src/browser/web/ui.vl:2154:4"));
			drop_row(region, going);
			__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2156:32");
			__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2157:36");
			__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2158:34");
			__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2159:32");
			__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2160:34");
			taken = taken + 1;
		}
		let $dr = null;
		if (at < row_rows.v.length) {
			$dr = __at(row_rows.v, at, "std/src/browser/web/ui.vl:2164:4")[0];
		} else {
			$dr = region[0];
		}
		const reference = __clone($dr);
		let offset = 0;
		for (const item of inserted) {
			const cell = new4(__clone(item), "std/src/browser/web/ui.vl:2170:42");
			const owner = new3();
			const row = run_with_owner(owner, ($ds) => {
				return open_row_before(region, render(cell, $ds), reference, $cz, $ds);
			});
			__insert_at(row_rows.v, at + offset, row, "std/src/browser/web/ui.vl:2173:21");
			__insert_at(row_owners.v, at + offset, owner, "std/src/browser/web/ui.vl:2174:23");
			__insert_at(row_cells.v, at + offset, __clone(cell), "std/src/browser/web/ui.vl:2175:22");
			__insert_at(row_keys.v, at + offset, key(item), "std/src/browser/web/ui.vl:2176:21");
			__insert_at(row_items.v, at + offset, __clone(item), "std/src/browser/web/ui.vl:2177:22");
			offset = offset + 1;
		}
		return;
	};
	const instance = open_rows(source);
	const drain2 = instance[2];
	const handle = instance[1](subscriber_of(() => {
		for (const op of live_ops(drain2())) {
			const $dz = op;
			let $dA = null;
			if ($dz[0] === 0) {
				const at = $dz[1];
				const removed = $dz[2];
				const inserted = $dz[3];
				if (removed.length === 0 || inserted.length === 0) {
					splice_rows(at, removed.length, inserted);
				} else {
					reconcile_span(at, removed.length, inserted);
				}
				$dA = undefined;
			} else if ($dz[0] === 1) {
				const at2 = $dz[1];
				const _was = $dz[2];
				const value = $dz[3];
				const $dB = __list_get(row_keys.v, at2);
				let $dC = null;
				if ($dB[0] === 0) {
					const held = $dB[1];
					$dC = key(value) === held;
				} else {
					$dC = false;
				}
				const same_key = $dC;
				let $dF = null;
				if (same_key) {
					const $dD = __list_get(row_cells.v, at2);
					let $dE = null;
					if ($dD[0] === 0) {
						const cell = $dD[1];
						__at_put(row_items.v, at2, __clone(value), "std/src/browser/web/ui.vl:2211:9");
						set3(cell, value, $cz, "std/src/browser/web/ui.vl:2212:14");
						$dE = undefined;
					} else {
						$dE = undefined;
					}
					$dF = $dE;
				} else {
					splice_rows(at2, 1, [ __clone(value) ]);
				}
				$dA = $dF;
			} else if ($dz[0] === 2) {
				const items = $dz[1];
				$dA = reconcile_pass(items);
			} else {
				const from = $dz[1];
				const count = $dz[2];
				const to = $dz[3];
				let moved = __clone(row_items.v);
				let lifted = [  ];
				let taken = 0;
				while (taken < count) {
					lifted.push(__remove_at(moved, from, "std/src/browser/web/ui.vl:2230:25"));
					taken = taken + 1;
				}
				let offset = 0;
				for (const item of lifted) {
					__insert_at(moved, to + offset, __clone(item), "std/src/browser/web/ui.vl:2235:13");
					offset = offset + 1;
				}
				reconcile_pass(moved);
				$dA = undefined;
			}
			$dA;
		}
		return;
	}, false));
	also_releasing(handle, instance[3]);
	take(get_owner($cA), handle, $cz);
	reconcile_pass(instance[0]());
}
function place6(self, parent, $cx, $cy) {
	place_each_by(parent, __clone(self[0]), self[1], self[2], $cx, $cy);
}
function child6(self, content, $U, $V) {
	place6(content, self, $U, $V);
	return __clone(self);
}
function start6(self) {
	return [ () => {
		return get(self);
	}, (subscriber) => {
		return on_settle2(self, subscriber);
	}, () => {
		return;
	} ];
}
function start7(self) {
	const transform = self[1];
	const upstream = start6(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return run_tracked2(runs, tracker, ($an, $ao, $ap) => {
			return transform(value, $an, $ao, $ap);
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
function observe_flow4(flow, observer, immediately, caller) {
	const instance = start7(flow);
	const pull = instance[0];
	if (!(immediately)) {
		pull();
	}
	const subscriber = mint_subscriber(() => {
		return observer(pull());
	});
	if (tracing.v) {
		trace_hooks.v[8](subscriber[0], caller);
	}
	const subscription = instance[1](subscriber);
	also_releasing(subscription, instance[2]);
	if (immediately) {
		observer(pull());
	}
	return subscription;
}
function sub6(self, observer, caller) {
	return observe_flow4(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true, caller);
}
function follow6(flow, observer, $al, $am) {
	take(get_owner($am), sub6(flow, observer, "std/src/browser/web/ui.vl:87:24"), $al);
}
function show4(self, condition, $bC, $bD) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	follow6(condition, (visible, $bE) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $bC, $bD);
	return __clone(self);
}
function open_rows2(self) {
	const $er = delta_cursor(self);
	let $es = null;
	if ($er[0] === 0) {
		const cursor = $er[1];
		$es = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return delta_since(self, cursor);
		}, () => {
			return drop_delta_cursor(self, cursor);
		} ];
	} else {
		$es = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return [ [ 2, get(self) ] ];
		}, () => {
			return;
		} ];
	}
	return $es;
}
function place_each_by2(parent, source, key, render, $cz, $cA) {
	const region = open(parent);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_cells = __shared_new([  ]);
	const row_rows = region[2];
	const row_owners = __shared_new([  ]);
	defer(get_owner($cA), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		close(region);
		return;
	});
	const reconcile_span = (at, count, list) => {
		const whole = at === 0 && count === row_rows.v.length;
		const previous_cells = held_span(row_cells, at, count);
		const previous_rows = held_span(row_rows, at, count);
		const previous_owners = held_span(row_owners, at, count);
		let $dO = null;
		if (at + count < row_rows.v.length) {
			$dO = __at(row_rows.v, at + count, "std/src/browser/web/ui.vl:1992:4")[0];
		} else {
			$dO = region[0];
		}
		const boundary = __clone($dO);
		const same = (_before, _after) => {
			return true;
		};
		let $dX = null;
		if (whole) {
			$dX = reconcile(__clone(row_keys.v), __clone(row_items.v), list, key, same);
		} else {
			$dX = reconcile(held_span(row_keys, at, count), held_span(row_items, at, count), list, key, same);
		}
		const plan = $dX;
		const settled = settled_steps(plan[0]);
		const references = row_references(plan[0], previous_rows, settled, boundary);
		let staying = [  ];
		let fill = 0;
		while (fill < previous_rows.length) {
			staying.push(false);
			fill = fill + 1;
		}
		let settled_at = 0;
		for (const step of plan[0]) {
			let $ea = null;
			if (__at(settled, settled_at, "std/src/browser/web/ui.vl:2023:7")) {
				const $dY = step;
				let $dZ = null;
				if ($dY[0] === 0) {
					const index = $dY[1];
					__at_put(staying, index, true, "std/src/browser/web/ui.vl:2026:7");
					$dZ = undefined;
				} else {
					$dZ = undefined;
				}
				$ea = $dZ;
			}
			$ea;
			settled_at = settled_at + 1;
		}
		let cut = [  ];
		let index2 = 0;
		for (const row of previous_rows) {
			if (__at(staying, index2, "std/src/browser/web/ui.vl:2038:7")) {
				cut.push([ 1 ]);
			} else {
				let $eb = null;
				if (index2 + 1 < previous_rows.length) {
					$eb = __at(previous_rows, index2 + 1, "std/src/browser/web/ui.vl:2042:6")[0];
				} else {
					$eb = boundary;
				}
				const end = __clone($eb);
				cut.push([ 0, cut_row(region, row, end) ]);
			}
			index2 = index2 + 1;
		}
		for (const gone of plan[1]) {
			dispose2(__at(previous_owners, gone, "std/src/browser/web/ui.vl:2051:4"));
			drop_row(region, __at(previous_rows, gone, "std/src/browser/web/ui.vl:2052:20"));
		}
		let next_cells = [  ];
		let next_rows = [  ];
		let next_owners = [  ];
		let position = 0;
		for (const step2 of plan[0]) {
			const item = __clone(__at(list, position, "std/src/browser/web/ui.vl:2059:15"));
			const reference = __clone(__at(references, position, "std/src/browser/web/ui.vl:2060:20"));
			const $ec = step2;
			let $ed = null;
			if ($ec[0] === 0) {
				const kept = $ec[1];
				const cell = __clone(__at(previous_cells, kept, "std/src/browser/web/ui.vl:2063:17"));
				set3(cell, item, $cz, "std/src/browser/web/ui.vl:2064:11");
				next_cells.push(cell);
				const $ek = __at(cut, kept, "std/src/browser/web/ui.vl:2066:12");
				let $el = null;
				if ($ek[0] === 0) {
					const content = __clone($ek[1]);
					insert_row(region, __at(previous_rows, kept, "std/src/browser/web/ui.vl:2068:26"), content, reference);
					$el = undefined;
				} else {
					$el = undefined;
				}
				$el;
				next_rows.push(__clone(__at(previous_rows, kept, "std/src/browser/web/ui.vl:2072:21")));
				next_owners.push(__clone(__at(previous_owners, kept, "std/src/browser/web/ui.vl:2073:23")));
				$ed = undefined;
			} else if ($ec[0] === 1) {
				const kept2 = $ec[1];
				const cell2 = __clone(__at(previous_cells, kept2, "std/src/browser/web/ui.vl:2079:17"));
				set3(cell2, item, $cz, "std/src/browser/web/ui.vl:2080:11");
				next_cells.push(cell2);
				const $em = __at(cut, kept2, "std/src/browser/web/ui.vl:2082:12");
				let $en = null;
				if ($em[0] === 0) {
					const content2 = __clone($em[1]);
					insert_row(region, __at(previous_rows, kept2, "std/src/browser/web/ui.vl:2084:26"), content2, reference);
					$en = undefined;
				} else {
					$en = undefined;
				}
				$en;
				next_rows.push(__clone(__at(previous_rows, kept2, "std/src/browser/web/ui.vl:2088:21")));
				next_owners.push(__clone(__at(previous_owners, kept2, "std/src/browser/web/ui.vl:2089:23")));
				$ed = undefined;
			} else {
				const cell3 = new4(item, "std/src/browser/web/ui.vl:2092:44");
				const owner = new3();
				next_cells.push(__clone(cell3));
				next_rows.push(run_with_owner(owner, ($dm) => {
					return open_row_before(region, render(cell3, $dm), reference, $cz, $dm);
				}));
				next_owners.push(owner);
				$ed = undefined;
			}
			$ed;
			position = position + 1;
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		let $eo = null;
		if (whole) {
			hold_rows(region, next_rows);
			row_keys.v = next_keys;
			row_items.v = __clone(list);
			row_cells.v = next_cells;
			row_owners.v = next_owners;
		} else {
			let taken = 0;
			while (taken < count) {
				__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2120:33");
				__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2121:37");
				__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2122:35");
				__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2123:33");
				__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2124:35");
				taken = taken + 1;
			}
			let offset = 0;
			while (offset < next_rows.length) {
				__insert_at(row_rows.v, at + offset, __clone(__at(next_rows, offset, "std/src/browser/web/ui.vl:2129:42")), "std/src/browser/web/ui.vl:2129:22");
				__insert_at(row_owners.v, at + offset, __clone(__at(next_owners, offset, "std/src/browser/web/ui.vl:2130:44")), "std/src/browser/web/ui.vl:2130:24");
				__insert_at(row_cells.v, at + offset, __clone(__at(next_cells, offset, "std/src/browser/web/ui.vl:2131:43")), "std/src/browser/web/ui.vl:2131:23");
				__insert_at(row_keys.v, at + offset, __clone(__at(next_keys, offset, "std/src/browser/web/ui.vl:2132:42")), "std/src/browser/web/ui.vl:2132:22");
				__insert_at(row_items.v, at + offset, __clone(__at(list, offset, "std/src/browser/web/ui.vl:2133:43")), "std/src/browser/web/ui.vl:2133:23");
				offset = offset + 1;
			}
			$eo = undefined;
		}
		return $eo;
	};
	const reconcile_pass = (list) => {
		return reconcile_span(0, row_rows.v.length, list);
	};
	const splice_rows = (at, removed, inserted) => {
		let taken = 0;
		while (taken < removed) {
			let $ep = null;
			if (at + 1 < row_rows.v.length) {
				$ep = __at(row_rows.v, at + 1, "std/src/browser/web/ui.vl:2148:5")[0];
			} else {
				$ep = region[0];
			}
			const end = __clone($ep);
			const going = __clone(__at(row_rows.v, at, "std/src/browser/web/ui.vl:2152:16"));
			cut_row(region, going, end);
			dispose2(__at(row_owners.v, at, "std/src/browser/web/ui.vl:2154:4"));
			drop_row(region, going);
			__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2156:32");
			__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2157:36");
			__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2158:34");
			__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2159:32");
			__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2160:34");
			taken = taken + 1;
		}
		let $eq = null;
		if (at < row_rows.v.length) {
			$eq = __at(row_rows.v, at, "std/src/browser/web/ui.vl:2164:4")[0];
		} else {
			$eq = region[0];
		}
		const reference = __clone($eq);
		let offset = 0;
		for (const item of inserted) {
			const cell = new4(__clone(item), "std/src/browser/web/ui.vl:2170:42");
			const owner = new3();
			const row = run_with_owner(owner, ($ds) => {
				return open_row_before(region, render(cell, $ds), reference, $cz, $ds);
			});
			__insert_at(row_rows.v, at + offset, row, "std/src/browser/web/ui.vl:2173:21");
			__insert_at(row_owners.v, at + offset, owner, "std/src/browser/web/ui.vl:2174:23");
			__insert_at(row_cells.v, at + offset, __clone(cell), "std/src/browser/web/ui.vl:2175:22");
			__insert_at(row_keys.v, at + offset, key(item), "std/src/browser/web/ui.vl:2176:21");
			__insert_at(row_items.v, at + offset, __clone(item), "std/src/browser/web/ui.vl:2177:22");
			offset = offset + 1;
		}
		return;
	};
	const instance = open_rows2(source);
	const drain2 = instance[2];
	const handle = instance[1](subscriber_of(() => {
		for (const op of live_ops(drain2())) {
			const $ex = op;
			let $ey = null;
			if ($ex[0] === 0) {
				const at = $ex[1];
				const removed = $ex[2];
				const inserted = $ex[3];
				if (removed.length === 0 || inserted.length === 0) {
					splice_rows(at, removed.length, inserted);
				} else {
					reconcile_span(at, removed.length, inserted);
				}
				$ey = undefined;
			} else if ($ex[0] === 1) {
				const at2 = $ex[1];
				const _was = $ex[2];
				const value = $ex[3];
				const $ez = __list_get(row_keys.v, at2);
				let $eA = null;
				if ($ez[0] === 0) {
					const held = $ez[1];
					$eA = key(value) === held;
				} else {
					$eA = false;
				}
				const same_key = $eA;
				let $eD = null;
				if (same_key) {
					const $eB = __list_get(row_cells.v, at2);
					let $eC = null;
					if ($eB[0] === 0) {
						const cell = $eB[1];
						__at_put(row_items.v, at2, __clone(value), "std/src/browser/web/ui.vl:2211:9");
						set3(cell, value, $cz, "std/src/browser/web/ui.vl:2212:14");
						$eC = undefined;
					} else {
						$eC = undefined;
					}
					$eD = $eC;
				} else {
					splice_rows(at2, 1, [ __clone(value) ]);
				}
				$ey = $eD;
			} else if ($ex[0] === 2) {
				const items = $ex[1];
				$ey = reconcile_pass(items);
			} else {
				const from = $ex[1];
				const count = $ex[2];
				const to = $ex[3];
				let moved = __clone(row_items.v);
				let lifted = [  ];
				let taken = 0;
				while (taken < count) {
					lifted.push(__remove_at(moved, from, "std/src/browser/web/ui.vl:2230:25"));
					taken = taken + 1;
				}
				let offset = 0;
				for (const item of lifted) {
					__insert_at(moved, to + offset, __clone(item), "std/src/browser/web/ui.vl:2235:13");
					offset = offset + 1;
				}
				reconcile_pass(moved);
				$ey = undefined;
			}
			$ey;
		}
		return;
	}, false));
	also_releasing(handle, instance[3]);
	take(get_owner($cA), handle, $cz);
	reconcile_pass(instance[0]());
}
function place7(self, parent, $cx, $cy) {
	place_each_by2(parent, __clone(self[0]), self[1], self[2], $cx, $cy);
}
function child7(self, content, $U, $V) {
	place7(content, self, $U, $V);
	return __clone(self);
}
function comp(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, scope ];
}
function set4(self, value, $eQ, caller) {
	set3(self, value, $eQ, caller);
}
function set_with(self, transform, $eP) {
	set4(self, transform(get(self)), $eP, "std/src/reactive.vl:2510:8");
}
const minting_derivation = __shared_new(false);
const next_subscriber_id = __shared_new(0);
const draining_turns = __shared_new([  ]);
const releasing_turns = __shared_new([  ]);
const tracing = __shared_new(false);
const trace_hooks = __shared_new([ (_identity, _site) => {
	return;
}, (_site) => {
	return;
}, (_identity) => {
	return "";
}, (_turn, _id) => {
	return;
}, (_turn, _subscriber) => {
	return;
}, (_subscriber, _cause) => {
	return;
}, (_subscriber, _draining) => {
	return false;
}, (_turn, _id) => {
	return;
}, (_id, _site) => {
	return;
} ]);
const waking = __shared_new([ 1 ]);
const no_cleanups = __shared_new([  ]);
const owner_lists_allocated_count = __shared_new(0);
const run_nurseries_allocated_count = __shared_new(0);
const app_fill = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::overflow", [ "::overflow", "syp1ckj", "overflow:hidden" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::height", [ "::height", "s22x0wn", "height:100%" ] ] ]) ] ];
const quad_grid = [ [ new Map([ [ "::display", [ "::display", "sbipssh", "display:grid" ] ], [ "::flex", [ "::flex", "smaui08", "flex:1 1 auto" ] ], [ "::gap", [ "::gap", "s1x5z460", "gap:1px" ] ], [ "::min-height", [ "::min-height", "sivwxlf", "min-height:0" ] ], [ "::background-color", [ "::background-color", "s1h4num7", "background-color:var(--stroke-hard)" ] ], [ "::grid-template-columns", [ "::grid-template-columns", "send2h", "grid-template-columns:minmax(0, 1fr)" ] ], [ "::grid-template-rows", [ "::grid-template-rows", "s11r85rj", "grid-template-rows:minmax(0, 8fr) minmax(0, 6fr) minmax(0, 4fr) minmax(0, 4fr)" ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", "s1ox8bcr", "grid-template-columns:minmax(0, 3fr) minmax(0, 2fr)" ] ], [ "1024px::grid-template-rows", [ "1024px::grid-template-rows", "s1th8vpw", "grid-template-rows:minmax(0, 7fr) minmax(0, 3fr)" ] ] ]) ] ];
const panel = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::overflow", [ "::overflow", "syp1ckj", "overflow:hidden" ] ], [ "::flex-direction", [ "::flex-direction", "s1atdsbb", "flex-direction:column" ] ], [ "::min-width", [ "::min-width", "sitgfdt", "min-width:0" ] ], [ "::min-height", [ "::min-height", "sivwxlf", "min-height:0" ] ], [ "::background-color", [ "::background-color", "s1ydv2q1", "background-color:var(--down-normal)" ] ] ]) ] ];
const panel_head = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::flex-wrap", [ "::flex-wrap", "szotvx1", "flex-wrap:wrap" ] ], [ "::flex-shrink", [ "::flex-shrink", "s1lr51x", "flex-shrink:0" ] ], [ "::gap", [ "::gap", "s8myyot", "gap:var(--space-1)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdoy", "padding-right:var(--space-2)" ] ], [ "::padding-top", [ "::padding-top", "sku5tg9", "padding-top:4px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzv99", "padding-bottom:4px" ] ], [ "::min-height", [ "::min-height", "sonfe9c", "min-height:32px" ] ], [ "::background-color", [ "::background-color", "ssxqr8g", "background-color:var(--down-bright)" ] ], [ "::box-sizing", [ "::box-sizing", "s9fgd5j", "box-sizing:border-box" ] ], [ "::justify-content", [ "::justify-content", "s1yv3ji6", "justify-content:space-between" ] ], [ "::border-bottom", [ "::border-bottom", "sepksxk", "border-bottom:1px solid var(--stroke-soft)" ] ] ]) ] ];
const app_bar = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::flex-wrap", [ "::flex-wrap", "szotvx1", "flex-wrap:wrap" ] ], [ "::flex-shrink", [ "::flex-shrink", "s1lr51x", "flex-shrink:0" ] ], [ "::gap", [ "::gap", "s8myyot", "gap:var(--space-1)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdoy", "padding-right:var(--space-2)" ] ], [ "::padding-top", [ "::padding-top", "sku5tg9", "padding-top:4px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzv99", "padding-bottom:4px" ] ], [ "::min-height", [ "::min-height", "sonfe9c", "min-height:32px" ] ], [ "::background-color", [ "::background-color", "ssxqr8g", "background-color:var(--down-bright)" ] ], [ "::box-sizing", [ "::box-sizing", "s9fgd5j", "box-sizing:border-box" ] ], [ "::border-bottom", [ "::border-bottom", "sehiopn", "border-bottom:1px solid var(--stroke-hard)" ] ] ]) ] ];
const rail_divider = [ [ new Map([ [ "::width", [ "::width", "sgdl0ko", "width:1px" ] ], [ "::align-self", [ "::align-self", "s1h12z4", "align-self:stretch" ] ], [ "::margin-left", [ "::margin-left", "szjswwl", "margin-left:2px" ] ], [ "::margin-right", [ "::margin-right", "suw81y3", "margin-right:2px" ] ], [ "::background-color", [ "::background-color", "s1h4num7", "background-color:var(--stroke-hard)" ] ] ]) ] ];
const page_title = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::letter-spacing", [ "::letter-spacing", "sbq2ipd", "letter-spacing:-0.01em" ] ], [ "::line-height", [ "::line-height", "snq8awq", "line-height:16px" ] ], [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "s1miqier", "color:var(--up-bright)" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ] ]) ] ];
const panel_title = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::letter-spacing", [ "::letter-spacing", "sbq2ipd", "letter-spacing:-0.01em" ] ], [ "::line-height", [ "::line-height", "snq8awq", "line-height:16px" ] ], [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::font-weight", [ "::font-weight", "skjzfp8", "font-weight:500" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ] ]) ] ];
const editor_host = [ [ new Map([ [ "::overflow", [ "::overflow", "syp1ckj", "overflow:hidden" ] ], [ "::flex", [ "::flex", "smaui08", "flex:1 1 auto" ] ], [ "::min-height", [ "::min-height", "sivwxlf", "min-height:0" ] ] ]) ] ];
const runner_host = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::flex", [ "::flex", "smaui08", "flex:1 1 auto" ] ], [ "::min-height", [ "::min-height", "sivwxlf", "min-height:0" ] ], [ "::background-color", [ "::background-color", "s1ydv2q1", "background-color:var(--down-normal)" ] ] ]) ] ];
const ghost_button = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::letter-spacing", [ "::letter-spacing", "sbq2ipd", "letter-spacing:-0.01em" ] ], [ "::line-height", [ "::line-height", "snq8awq", "line-height:16px" ] ], [ "::padding-top", [ "::padding-top", "sku5tg9", "padding-top:4px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzv99", "padding-bottom:4px" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdoy", "padding-right:var(--space-2)" ] ], [ "::font-family", [ "::font-family", "s19qv9u6", "font-family:inherit" ] ], [ "::border-radius", [ "::border-radius", "s94jh8x", "border-radius:4px" ] ], [ "::transition", [ "::transition", "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ], [ "::cursor", [ "::cursor", "s1onu0uk", "cursor:pointer" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::background-color", [ "::background-color", "s1wmjjx5", "background-color:transparent" ] ], [ "::border", [ "::border", "s1mnphwb", "border:none" ] ], [ ":hover:color", [ ":hover:color", "s1ytnaev", "color:var(--up-bright)" ] ], [ ":hover:background-color", [ ":hover:background-color", "s1s7tv0o", "background-color:var(--down-hover)" ] ], [ ":active:background-color", [ ":active:background-color", "skghblk", "background-color:var(--down-active)" ] ] ]) ] ];
const primary_button = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::letter-spacing", [ "::letter-spacing", "sbq2ipd", "letter-spacing:-0.01em" ] ], [ "::line-height", [ "::line-height", "snq8awq", "line-height:16px" ] ], [ "::padding-top", [ "::padding-top", "sku5tg9", "padding-top:4px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzv99", "padding-bottom:4px" ] ], [ "::padding-left", [ "::padding-left", "s13w7vfx", "padding-left:var(--space-3)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdpv", "padding-right:var(--space-3)" ] ], [ "::font-family", [ "::font-family", "s19qv9u6", "font-family:inherit" ] ], [ "::border-radius", [ "::border-radius", "s94jh8x", "border-radius:4px" ] ], [ "::transition", [ "::transition", "sj84onl", "transition:filter 80ms ease" ] ], [ "::cursor", [ "::cursor", "s1onu0uk", "cursor:pointer" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "s30khfz", "color:var(--primary-on)" ] ], [ "::background-color", [ "::background-color", "s19dy6kf", "background-color:var(--primary)" ] ], [ "::border", [ "::border", "s1mnphwb", "border:none" ] ], [ ":hover:filter", [ ":hover:filter", "s15eo8y8", "filter:brightness(1.08)" ] ], [ ":active:filter", [ ":active:filter", "sdue9po", "filter:brightness(0.94)" ] ] ]) ] ];
const select_box = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::letter-spacing", [ "::letter-spacing", "sbq2ipd", "letter-spacing:-0.01em" ] ], [ "::line-height", [ "::line-height", "snq8awq", "line-height:16px" ] ], [ "::padding-top", [ "::padding-top", "s1foenn1", "padding-top:0" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1hggi4x", "padding-bottom:0" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s16t3pvj", "padding-right:22px" ] ], [ "::font-family", [ "::font-family", "s19qv9u6", "font-family:inherit" ] ], [ "::border-radius", [ "::border-radius", "s94jh8x", "border-radius:4px" ] ], [ "::transition", [ "::transition", "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ], [ "::cursor", [ "::cursor", "s1onu0uk", "cursor:pointer" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::appearance", [ "::appearance", "sxfhabj", "appearance:none" ] ], [ "::height", [ "::height", "s22xxov", "height:24px" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::background-color", [ "::background-color", "s1ydv2q1", "background-color:var(--down-normal)" ] ], [ "::border", [ "::border", "s8ckzec", "border:1px solid var(--stroke-soft)" ] ], [ "::background-image", [ "::background-image", "sg7ln4b", "background-image:linear-gradient(45deg, transparent 50%, currentcolor 50%), linear-gradient(135deg, currentcolor 50%, transparent 50%)" ] ], [ "::background-position", [ "::background-position", "s1cysvk2", "background-position:calc(100% - 13px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px)" ] ], [ "::background-size", [ "::background-size", "s1fnd457", "background-size:4px 4px, 4px 4px" ] ], [ "::background-repeat", [ "::background-repeat", "s1q9mjsm", "background-repeat:no-repeat" ] ], [ "::box-sizing", [ "::box-sizing", "s9fgd5j", "box-sizing:border-box" ] ], [ ":hover:color", [ ":hover:color", "s1ytnaev", "color:var(--up-bright)" ] ], [ ":hover:border-color", [ ":hover:border-color", "s1of7ou7", "border-color:var(--stroke-hard)" ] ] ]) ] ];
const version_select = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk1zs", "font-size:12px" ] ], [ "::letter-spacing", [ "::letter-spacing", "sbq2ipd", "letter-spacing:-0.01em" ] ], [ "::line-height", [ "::line-height", "snq8awq", "line-height:16px" ] ], [ "::padding-top", [ "::padding-top", "s1foenn1", "padding-top:0" ] ], [ "::padding-bottom", [ "::padding-bottom", "s1hggi4x", "padding-bottom:0" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s16t3pvj", "padding-right:22px" ] ], [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::border-radius", [ "::border-radius", "s94jh8x", "border-radius:4px" ] ], [ "::transition", [ "::transition", "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ], [ "::cursor", [ "::cursor", "s1onu0uk", "cursor:pointer" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::appearance", [ "::appearance", "sxfhabj", "appearance:none" ] ], [ "::height", [ "::height", "s22xxov", "height:24px" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::background-color", [ "::background-color", "s1ydv2q1", "background-color:var(--down-normal)" ] ], [ "::border", [ "::border", "s8ckzec", "border:1px solid var(--stroke-soft)" ] ], [ "::background-image", [ "::background-image", "sg7ln4b", "background-image:linear-gradient(45deg, transparent 50%, currentcolor 50%), linear-gradient(135deg, currentcolor 50%, transparent 50%)" ] ], [ "::background-position", [ "::background-position", "s1cysvk2", "background-position:calc(100% - 13px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px)" ] ], [ "::background-size", [ "::background-size", "s1fnd457", "background-size:4px 4px, 4px 4px" ] ], [ "::background-repeat", [ "::background-repeat", "s1q9mjsm", "background-repeat:no-repeat" ] ], [ "::box-sizing", [ "::box-sizing", "s9fgd5j", "box-sizing:border-box" ] ], [ ":hover:color", [ ":hover:color", "s1ytnaev", "color:var(--up-bright)" ] ], [ ":hover:border-color", [ ":hover:border-color", "s1of7ou7", "border-color:var(--stroke-hard)" ] ], [ "::font-feature-settings", [ "::font-feature-settings", "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ]) ] ];
const status_line = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::letter-spacing", [ "::letter-spacing", "sbq2ipd", "letter-spacing:-0.01em" ] ], [ "::line-height", [ "::line-height", "snq8awq", "line-height:16px" ] ], [ "::padding-left", [ "::padding-left", "s13w7ve3", "padding-left:var(--space-1)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdo1", "padding-right:var(--space-1)" ] ], [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::margin-left", [ "::margin-left", "s10oplpw", "margin-left:auto" ] ], [ "::color", [ "::color", "shpfnhp", "color:var(--up-dim)" ] ] ]) ] ];
const confirm_bar = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::flex-wrap", [ "::flex-wrap", "szotvx1", "flex-wrap:wrap" ] ], [ "::flex-shrink", [ "::flex-shrink", "s1lr51x", "flex-shrink:0" ] ], [ "::gap", [ "::gap", "s8myypq", "gap:var(--space-2)" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdoy", "padding-right:var(--space-2)" ] ], [ "::padding-top", [ "::padding-top", "sku5tg9", "padding-top:4px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzv99", "padding-bottom:4px" ] ], [ "::min-height", [ "::min-height", "sonfe9c", "min-height:32px" ] ], [ "::background-color", [ "::background-color", "ssxqr8g", "background-color:var(--down-bright)" ] ], [ "::box-sizing", [ "::box-sizing", "s9fgd5j", "box-sizing:border-box" ] ], [ "::border-bottom", [ "::border-bottom", "sepksxk", "border-bottom:1px solid var(--stroke-soft)" ] ] ]) ] ];
const confirm_question = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::letter-spacing", [ "::letter-spacing", "sbq2ipd", "letter-spacing:-0.01em" ] ], [ "::line-height", [ "::line-height", "snq8awq", "line-height:16px" ] ], [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::margin-right", [ "::margin-right", "sp4tc1m", "margin-right:auto" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ] ]) ] ];
const report_well = [ [ new Map([ [ "::font-family", [ "::font-family", "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::font-feature-settings", [ "::font-feature-settings", "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ], [ "::overflow", [ "::overflow", "s19aluk0", "overflow:auto" ] ], [ "::flex", [ "::flex", "smaui08", "flex:1 1 auto" ] ], [ "::padding-top", [ "::padding-top", "sku5tg9", "padding-top:4px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzv99", "padding-bottom:4px" ] ], [ "::margin", [ "::margin", "s1tlfgp4", "margin:var(--space-0)" ] ], [ "::min-height", [ "::min-height", "sivwxlf", "min-height:0" ] ], [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::line-height", [ "::line-height", "snq8cl8", "line-height:18px" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::white-space", [ "::white-space", "s41qynl", "white-space:pre-wrap" ] ] ]) ] ];
const diag_row_error = [ [ new Map([ [ "::padding-top", [ "::padding-top", "sku5sm0", "padding-top:3px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzuf0", "padding-bottom:3px" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdoy", "padding-right:var(--space-2)" ] ], [ "::border-top", [ "::border-top", "szweawk", "border-top:1px solid var(--stroke-soft)" ] ], [ "::border-left", [ "::border-left", "s1v5t6xm", "border-left:2px solid var(--down-danger)" ] ], [ ":first-child:border-top", [ ":first-child:border-top", "sq2xqkq", "border-top:1px solid transparent" ] ], [ "::background-color", [ "::background-color", "s1er9mcg", "background-color:rgb(from var(--down-danger) r g b / 0.07)" ] ] ]) ] ];
const diag_row_warning = [ [ new Map([ [ "::padding-top", [ "::padding-top", "sku5sm0", "padding-top:3px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzuf0", "padding-bottom:3px" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdoy", "padding-right:var(--space-2)" ] ], [ "::border-top", [ "::border-top", "szweawk", "border-top:1px solid var(--stroke-soft)" ] ], [ "::border-left", [ "::border-left", "somu7p8", "border-left:2px solid var(--down-caution)" ] ], [ ":first-child:border-top", [ ":first-child:border-top", "sq2xqkq", "border-top:1px solid transparent" ] ], [ "::background-color", [ "::background-color", "s6ng1wh", "background-color:rgb(from var(--down-caution) r g b / 0.06)" ] ] ]) ] ];
const diag_error = [ [ new Map([ [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "sxurvz1", "color:var(--up-error)" ] ] ]) ] ];
const diag_warning = [ [ new Map([ [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::color", [ "::color", "s7y076u", "color:var(--up-caution)" ] ] ]) ] ];
const diag_site = [ [ new Map([ [ "::color", [ "::color", "shpfnhp", "color:var(--up-dim)" ] ] ]) ] ];
const diag_note = [ [ new Map([ [ "::color", [ "::color", "shpfnhp", "color:var(--up-dim)" ] ] ]) ] ];
const diag_trace = [ [ new Map([ [ "::color", [ "::color", "shpfnhp", "color:var(--up-dim)" ] ] ]) ] ];
const console_line = [ [ new Map([ [ "::padding-top", [ "::padding-top", "sku5qxi", "padding-top:1px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzsqi", "padding-bottom:1px" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdoy", "padding-right:var(--space-2)" ] ] ]) ] ];
const console_error = [ [ new Map([ [ "::padding-top", [ "::padding-top", "sku5qxi", "padding-top:1px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzsqi", "padding-bottom:1px" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdoy", "padding-right:var(--space-2)" ] ], [ "::color", [ "::color", "sxurvz1", "color:var(--up-error)" ] ] ]) ] ];
const quiet_row = [ [ new Map([ [ "::padding-top", [ "::padding-top", "sku5sm0", "padding-top:3px" ] ], [ "::padding-bottom", [ "::padding-bottom", "s14jzuf0", "padding-bottom:3px" ] ], [ "::padding-left", [ "::padding-left", "s13w7vf0", "padding-left:var(--space-2)" ] ], [ "::padding-right", [ "::padding-right", "s1anvdoy", "padding-right:var(--space-2)" ] ], [ "::color", [ "::color", "shpfnhp", "color:var(--up-dim)" ] ] ]) ] ];
const code_palette = [ [ new Map([ [ "::--code-face", [ "::--code-face", "sepvury", "--code-face:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ], [ "::--code-features", [ "::--code-features", "s1xx7ixb", "--code-features:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ], [ "::--code-size", [ "::--code-size", "s17tflw5", "--code-size:13px" ] ], [ "::--code-bg", [ "::--code-bg", "sr79rlz", "--code-bg:var(--down-normal)" ] ], [ "::--code-fg", [ "::--code-fg", "s19c5xn7", "--code-fg:var(--up-bright)" ] ], [ "::--code-dim", [ "::--code-dim", "s1u3ovjb", "--code-dim:var(--up-dim)" ] ], [ "::--code-gutter-edge", [ "::--code-gutter-edge", "s19k3kma", "--code-gutter-edge:var(--stroke-soft)" ] ], [ "::--code-active-line", [ "::--code-active-line", "s1fhczbb", "--code-active-line:rgb(from var(--up-bright) r g b / 0.04)" ] ], [ "::--code-active-gutter", [ "::--code-active-gutter", "s1t1pcq8", "--code-active-gutter:rgb(from var(--up-bright) r g b / 0.07)" ] ], [ "::--code-selection", [ "::--code-selection", "snky57a", "--code-selection:rgb(from var(--up-bright) r g b / 0.18)" ] ], [ "::--code-keyword", [ "::--code-keyword", "sbb9pzp", "--code-keyword:var(--primary)" ] ], [ "::--code-string", [ "::--code-string", "s18b2uzn", "--code-string:var(--accent)" ] ], [ "::--code-plain", [ "::--code-plain", "s8onzey", "--code-plain:var(--up-normal)" ] ], [ "::--code-callable", [ "::--code-callable", "s16k06qr", "--code-callable:var(--tint-callable)" ] ], [ "::--code-type", [ "::--code-type", "s1n2n3b1", "--code-type:var(--up-bright)" ] ], [ "::--code-comment", [ "::--code-comment", "s5j3euk", "--code-comment:var(--tint-comment)" ] ], [ "::--code-attr", [ "::--code-attr", "s14j98t0", "--code-attr:rgb(from var(--primary) r g b / 0.65)" ] ], [ "::--code-path", [ "::--code-path", "s7em04x", "--code-path:rgb(from var(--up-bright) r g b / 0.6)" ] ], [ "::--code-operator", [ "::--code-operator", "s8nt3s2", "--code-operator:rgb(from var(--up-bright) r g b / 0.72)" ] ], [ "::--code-error", [ "::--code-error", "s1dxptvb", "--code-error:var(--up-error)" ] ], [ "::--code-caution", [ "::--code-caution", "s1yauy2a", "--code-caution:var(--up-caution)" ] ] ]) ] ];
const shell = [ [ new Map([ [ "::min-height", [ "::min-height", "sondrfd", "min-height:100%" ] ], [ "::font-family", [ "::font-family", "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ], [ "::font-size", [ "::font-size", "sayk3oa", "font-size:14px" ] ], [ "::line-height", [ "::line-height", "snq8cl8", "line-height:18px" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::background-color", [ "::background-color", "s4e3ofu", "background-color:var(--down-dim)" ] ] ]) ] ];
const no_drag = [ [ new Map([ [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", "svfmjlf", "-webkit-user-drag:none" ] ] ]) ] ];
const nav_brand = [ [ new Map([ [ "::display", [ "::display", "sbiovxm", "display:flex" ] ], [ "::gap", [ "::gap", "s8myyqn", "gap:var(--space-3)" ] ], [ "::align-items", [ "::align-items", "s1rpzmas", "align-items:center" ] ], [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::font-weight", [ "::font-weight", "skjzgjh", "font-weight:600" ] ], [ "::letter-spacing", [ "::letter-spacing", "s1odkmbv", "letter-spacing:0.35em" ] ] ]) ] ];
const nav_mark = [ [ new Map([ [ "::display", [ "::display", "sowfjmu", "display:block" ] ], [ "::width", [ "::width", "s178hbq8", "width:36px" ] ], [ "::height", [ "::height", "s22x9bm", "height:18px" ] ], [ "::background-color", [ "::background-color", "syz58y5", "background-color:var(--up-bright)" ] ], [ "::-webkit-mask", [ "::-webkit-mask", "scqkrg6", "-webkit-mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ], [ "::mask", [ "::mask", "s11mtiwm", "mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ]) ] ];
const nav_link = [ [ new Map([ [ "::font-size", [ "::font-size", "sayk2u1", "font-size:13px" ] ], [ "::color", [ "::color", "ssxqrx8", "color:var(--up-normal)" ] ], [ "::text-decoration", [ "::text-decoration", "svrgm1f", "text-decoration:none" ] ], [ "::transition", [ "::transition", "sbcnc8a", "transition:color 80ms ease" ] ], [ "::user-select", [ "::user-select", "s1iy45h3", "user-select:none" ] ], [ ":hover:color", [ ":hover:color", "s1ytnaev", "color:var(--up-bright)" ] ] ]) ] ];
const console_cap = 300;
const status = new5("Loading the compiler\u{2026}", "src/playground.vl:281:23");
const diagnostics = new6([  ], "src/playground.vl:282:51");
const console_lines = new6([  ], "src/playground.vl:283:56");
const can_format = new6(false, "src/playground.vl:284:27");
const can_platform = new6(false, "src/playground.vl:285:29");
const can_prelude = new6(false, "src/playground.vl:286:28");
const mode = new5("browser", "src/playground.vl:287:21");
const share_label = new5("Share", "src/playground.vl:288:28");
const next_row_id = __shared_new(0);
const modified_from = new5("", "src/playground.vl:298:30");
const buffer_dirty = __shared_new(false);
const run_token = __shared_new("");
const confirm_target = new5("", "src/playground.vl:310:31");
const run = () => {
	if (VilanPlayground.compile(VilanPlayground.value())) {
		set(status, "Compiling\u{2026}", [ 1 ], "src/playground.vl:314:11");
	} else {
		set(status, "Compiler busy; queued.", [ 1 ], "src/playground.vl:316:11");
	}
	return;
};
const format = () => {
	if (!(VilanPlayground.format())) {
		set(status, "Compiler busy; try again.", [ 1 ], "src/playground.vl:322:11");
	}
	return;
};
const share = () => {
	return VilanPlayground.share();
};
const load_example = (name) => {
	const $k = name;
	let $l = null;
	if ($k === "server") {
		$l = "node";
	} else {
		$l = "browser";
	}
	const platform = $l;
	VilanPlayground.setMode(platform);
	VilanPlayground.setPrelude("on");
	VilanPlayground.setDoc(VilanPlayground.example(name));
	set2(diagnostics, [  ], [ 1 ], "src/playground.vl:343:15");
	set3(console_lines, [  ], [ 1 ], "src/playground.vl:344:17");
	run();
	return;
};
const pick = (name) => {
	if (buffer_dirty.v) {
		set(confirm_target, name, [ 1 ], "src/playground.vl:356:19");
	} else {
		load_example(name);
	}
	return;
};
const confirm_replace = () => {
	const name = get(confirm_target);
	set(confirm_target, "", [ 1 ], "src/playground.vl:364:18");
	if (name !== "") {
		load_example(name);
	}
	return;
};
const cancel_replace = () => {
	return set(confirm_target, "", [ 1 ], "src/playground.vl:370:41");
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
	set(share_label, label, [ 1 ], "src/playground.vl:390:15");
	const $y = share_revert.v;
	let $z = null;
	if ($y[0] === 0) {
		const timer = $y[1];
		$z = cancel(timer);
	} else {
		$z = undefined;
	}
	$z;
	const timer2 = after(1600);
	share_revert.v = [ 0, __clone(timer2) ];
	__task(async () => {
		if (await (wait(timer2, [ 1 ]))) {
			set(share_label, "Share", [ 1 ], "src/playground.vl:399:17");
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
	set2(diagnostics, rows, [ 1 ], "src/playground.vl:433:15");
	return rows.length;
};
mount_root("app", ($F) => {
	return playground_page(status, diagnostics, console_lines, can_format, can_platform, can_prelude, share_label, mode, modified_from, confirm_target, run, format, share, confirm_replace, cancel_replace, [ 1 ], $F);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $eM = null;
	if (kind === "ready") {
		set3(can_format, event.canFormat, [ 1 ], "src/playground.vl:463:15");
		set3(can_platform, event.canPlatform, [ 1 ], "src/playground.vl:464:17");
		if (!(event.canPlatform)) {
			VilanPlayground.setMode("browser");
		}
		set3(can_prelude, event.canPrelude, [ 1 ], "src/playground.vl:470:16");
		if (!(event.canPrelude)) {
			VilanPlayground.setPrelude("on");
		}
		set(status, "Ready (vilan " + event.version + ")", [ 1 ], "src/playground.vl:478:11");
		compiler_ready.v = true;
		run_on_arrival();
	} else if (kind === "doc") {
		doc_ready.v = true;
		run_on_arrival();
	} else if (kind === "dirty") {
		buffer_dirty.v = event.changed;
		set(modified_from, event.name, [ 1 ], "src/playground.vl:486:18");
		if (!(event.changed)) {
			set(confirm_target, "", [ 1 ], "src/playground.vl:491:20");
		}
		$eM = undefined;
	} else if (kind === "command") {
		const command = event.command;
		if (command === "run") {
			run();
		} else if (command === "format") {
			format();
		} else if (command === "pick") {
			pick(event.name);
		} else if (command === "mode") {
			set(mode, event.name, [ 1 ], "src/playground.vl:502:10");
		}
		$eM = undefined;
	} else if (kind === "formatted") {
		const declined = event.declined;
		if (declined !== "") {
			set(status, "Format left the buffer unchanged \u{2014} " + declined, [ 1 ], "src/playground.vl:509:12");
		} else if (event.changed) {
			set(status, "Formatted.", [ 1 ], "src/playground.vl:511:12");
		} else {
			set(status, "Format made no changes.", [ 1 ], "src/playground.vl:513:12");
		}
		$eM = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			set(status, "Link copied to the clipboard.", [ 1 ], "src/playground.vl:517:12");
			flash_share("Copied!");
		} else {
			set(status, "Link ready in the address bar.", [ 1 ], "src/playground.vl:520:12");
			flash_share("Link ready");
		}
		$eM = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $eN = null;
		if (event.ok) {
			if (event.platform === "node") {
				set(status, "No problems (server check, vilan " + event.version + ").", [ 1 ], "src/playground.vl:528:13");
			} else {
				set(status, "No problems (vilan " + event.version + ").", [ 1 ], "src/playground.vl:530:13");
			}
			$eN = undefined;
		} else if (count === 1) {
			set(status, "1 problem; see the diagnostics.", [ 1 ], "src/playground.vl:533:12");
		} else {
			set(status, "" + count + " problems; see the diagnostics.", [ 1 ], "src/playground.vl:535:12");
		}
		$eM = $eN;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $eO = null;
		if (event.platform === "node") {
			if (event.ok) {
				set(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ], "src/playground.vl:543:13");
			} else {
				set(status, "Build failed; see the diagnostics.", [ 1 ], "src/playground.vl:545:13");
			}
			$eO = undefined;
		} else {
			set3(console_lines, [  ], [ 1 ], "src/playground.vl:548:19");
			if (event.ok) {
				set(status, "Compiled (vilan " + event.version + ")", [ 1 ], "src/playground.vl:550:13");
				const token = crypto.randomUUID();
				run_token.v = token;
				VilanPlayground.runProgram(event.js, event.css, token);
			} else {
				set(status, "Build failed; see the diagnostics.", [ 1 ], "src/playground.vl:559:13");
				run_token.v = "";
				VilanPlayground.clearProgram();
			}
			$eO = undefined;
		}
		$eM = $eO;
	} else if (kind === "crash") {
		set(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ], "src/playground.vl:565:11");
	}
	return $eM;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const expected = run_token.v;
	const kind = message.kind;
	if (expected !== "" && message.token === expected && (kind === "log" || kind === "error")) {
		set_with(console_lines, (lines) => {
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
//# sourceMappingURL=playground.js.map
