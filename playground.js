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
function clamp_delay(ms) {
	let $u = null;
	if (ms < 0) {
		$u = 0;
	} else {
		$u = ms;
	}
	return $u;
}
function after(ms) {
	return [ __timer(clamp_delay(ms)) ];
}
async function wait(self, $v) {
	return await (self[0].wait(ambient_signal($v)));
}
function cancel(self) {
	self[0].cancel();
}
function has_spawned(self) {
	return __nursery_has_spawned(self);
}
function ambient_signal($w) {
	const $x = $w;
	let $y = null;
	if ($x[0] === 0) {
		const n = $x[1];
		$y = [ 0, n.signal_of() ];
	} else {
		$y = [ 1 ];
	}
	return $y;
}
function detached_nursery() {
	return __nursery_new_detached();
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
		let $e = null;
		if (subscriber[3]) {
			if (!(turn2[3].v.has(key))) {
				turn2[3].v.set(key, true);
				turn2[1].v.push(__clone(subscriber));
			}
			$e = undefined;
		} else if (!(turn2[2].v.has(key))) {
			turn2[2].v.set(key, true);
			let index = turn2[0].v.length;
			while (index > 0 && __at(turn2[0].v, index - 1, "std/src/reactive.vl:414:21")[0] > subscriber[0]) {
				index = index - 1;
			}
			__insert_at(turn2[0].v, index, __clone(subscriber), "std/src/reactive.vl:417:25");
		}
		$e;
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
	const $aU = turn2;
	let $aV = null;
	if ($aU[0] === 0) {
		const ambient = $aU[1];
		$aV = enqueue(ambient, [ reissued(subscriber) ]);
	} else {
		const $aW = last(draining_turns.v);
		let $aX = null;
		if ($aW[0] === 0) {
			const draining = $aW[1];
			$aX = enqueue(draining, [ reissued(subscriber) ]);
		} else {
			if (subscriber[2].v) {
				subscriber[1]();
			}
			$aX = undefined;
		}
		$aV = $aX;
	}
	return $aV;
}
function reissued(subscriber) {
	return [ subscriber[0], subscriber[1], subscriber[2], subscriber[3] ];
}
function wake(subscriber) {
	defer_subscriber([ 1 ], subscriber);
}
function dispose(self, $bt) {
	const $bu = $bt;
	let $bv = null;
	if ($bu[0] === 0) {
		const established = $bu[1];
		$bv = [ 0, established ];
	} else {
		$bv = last(draining_turns.v);
	}
	const ambient = $bv;
	release_under(self, ambient);
}
function detach(handle) {
	const $aZ = last(releasing_turns.v);
	let $ba = null;
	if ($aZ[0] === 0) {
		const at_release = $aZ[1];
		$ba = at_release;
	} else {
		$ba = last(draining_turns.v);
	}
	const turn2 = $ba;
	release_under(handle, turn2);
}
function release_under(handle, ambient) {
	handle[2].v = false;
	const $bb = [ 0, handle[0] ];
	let $bc = null;
	if ($bb[0] === 0) {
		const subscribers = $bb[1];
		let kept = [  ];
		for (const subscriber of subscribers.v) {
			if (subscriber[0] !== handle[1]) {
				kept.push(__clone(subscriber));
			}
		}
		subscribers.v = kept;
		$bc = undefined;
	} else {
		$bc = undefined;
	}
	$bc;
	const $bd = ambient;
	let $be = null;
	if ($bd[0] === 0) {
		const turn2 = $bd[1];
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
		$be = undefined;
	} else {
		$be = undefined;
	}
	$be;
	const $bf = handle[3].v;
	let $bg = null;
	if ($bf[0] === 0) {
		const release = $bf[1];
		handle[3].v = [ 1 ];
		releasing_turns.v.push(ambient);
		__with_finally(release, () => {
			__list_pop(releasing_turns.v);
			return;
		});
		$bg = undefined;
	} else {
		$bg = undefined;
	}
	return $bg;
}
function new3() {
	return [ __shared_new([ 0, no_cleanups, false, [ 1 ] ]), 0 ];
}
function is_disposed(self) {
	return self[0].v[0] !== self[1];
}
function defer(self, cleanup) {
	let $ad = null;
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
		$ad = undefined;
	}
	return $ad;
}
function renew(self) {
	const $as = self[0].v[3];
	let $at = null;
	if ($as[0] === 0) {
		const nursery2 = __clone($as[1]);
		let $au = null;
		if (has_spawned(nursery2)) {
			$au = [ 1 ];
		} else {
			$au = [ 0, nursery2 ];
		}
		$at = $au;
	} else {
		$at = [ 1 ];
	}
	const carried = $at;
	advance([ self[0], self[0].v[0] ], carried);
	if (is_none(self[0].v[3])) {
		run_nurseries_allocated_count.v = run_nurseries_allocated_count.v + 1;
		self[0].v[3] = [ 0, detached_nursery() ];
	}
	return [ self[0], self[0].v[0] ];
}
function nursery(self) {
	let $aF = null;
	if (is_disposed(self)) {
		$aF = [ 1 ];
	} else {
		$aF = self[0].v[3];
	}
	return $aF;
}
function dispose2(self) {
	advance(self, [ 1 ]);
}
function advance(self, carried) {
	let $aE = null;
	if (!(is_disposed(self))) {
		const held = self[0].v;
		self[0].v = [ self[1] + 1, no_cleanups, false, carried ];
		const $av = held[3];
		let $aw = null;
		if ($av[0] === 0) {
			const nursery2 = $av[1];
			if (is_none(carried)) {
				nursery2.cancel();
			}
			$aw = undefined;
		} else {
			$aw = undefined;
		}
		$aw;
		let $aD = null;
		if (held[2]) {
			let failure = [ 1 ];
			for (const cleanup of held[1].v) {
				const $ay = __guarded(cleanup);
				let $az = null;
				if ($ay[0] === 0) {
					const message = $ay[1];
					if (is_none(failure)) {
						failure = [ 0, message ];
					}
					$az = undefined;
				} else {
					$az = undefined;
				}
				$az;
			}
			const $aB = failure;
			let $aC = null;
			if ($aB[0] === 0) {
				const message2 = $aB[1];
				$aC = (() => {
					throw __panic(message2, "std/src/reactive.vl:1207:27");
				})();
			} else {
				$aC = undefined;
			}
			$aD = $aC;
		}
		$aE = $aD;
	}
	return $aE;
}
function get_owner($ac) {
	return $ac;
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
	const $an = tracker[0].v[6];
	let $ao = null;
	if ($an[0] === 0) {
		const lists = $an[1];
		if (!(is_empty(lists.v[0]))) {
			lists.v[0] = [  ];
		}
		$ao = undefined;
	} else {
		$ao = undefined;
	}
	$ao;
	return [ __clone(tracker), epoch ];
}
function close_run(tracker) {
	tracker[0].v[1] = false;
	const $aK = tracker[0].v[6];
	let $aL = null;
	if ($aK[0] === 0) {
		const lists = $aK[1];
		$aL = lists;
	} else {
		return;
		$aL = undefined;
	}
	const lists2 = $aL;
	const $aM = tracker[0].v[5];
	let $aN = null;
	if ($aM[0] === 0) {
		const target = __clone($aM[1]);
		$aN = reconnect(tracker, lists2, target);
	} else {
		if (!(is_empty(lists2.v[0])) || !(is_empty(lists2.v[1]))) {
			lists2.v[1] = __clone(lists2.v[0]);
		}
		$aN = undefined;
	}
	$aN;
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
		const $aS = reusable(held, kept, dependency[0], position);
		let $aT = null;
		if ($aS[0] === 0) {
			const index = $aS[1];
			__at_put(kept, index, true, "std/src/reactive.vl:1624:5");
			next.push(__clone(__at(held, index, "std/src/reactive.vl:1625:15")));
			$aT = undefined;
		} else {
			next.push([ dependency[0], dependency[1](relay_for(tracker, target)) ]);
			$aT = undefined;
		}
		$aT;
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
	const $aO = identity;
	let $aP = null;
	if ($aO[0] === 0) {
		const wanted = $aO[1];
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
		$aP = [ 1 ];
	} else {
		$aP = [ 1 ];
	}
	return $aP;
}
function same_identity(identity, wanted) {
	const $aQ = identity;
	let $aR = null;
	if ($aQ[0] === 0) {
		const held = $aQ[1];
		$aR = held === wanted;
	} else {
		$aR = false;
	}
	return $aR;
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
	const $bk = tracker[0].v[6];
	let $bl = null;
	if ($bk[0] === 0) {
		const lists = $bk[1];
		$bl = lists;
	} else {
		return;
		$bl = undefined;
	}
	const lists2 = $bl;
	let $bm = null;
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
		$bm = undefined;
	}
	return $bm;
}
function forget_reads(tracker) {
	const $bn = tracker[0].v[6];
	let $bo = null;
	if ($bn[0] === 0) {
		const lists = $bn[1];
		$bo = lists;
	} else {
		return;
		$bo = undefined;
	}
	const lists2 = $bo;
	let $bp = null;
	if (!(is_empty(lists2.v[2]))) {
		const edges = __clone(lists2.v[2]);
		lists2.v[2] = [  ];
		for (const edge of edges) {
			detach(edge[1]);
		}
		$bp = undefined;
	}
	$bp;
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
		const $bq = previous;
		let $br = null;
		if ($bq[0] === 0) {
			const earlier = $bq[1];
			$br = earlier();
		} else {
			$br = undefined;
		}
		return $br;
	} ];
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
	const $J = property;
	let $K = null;
	if ($J === "padding") {
		$K = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($J === "margin") {
		$K = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($J === "inset") {
		$K = ";top;right;bottom;left;";
	} else if ($J === "flex") {
		$K = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($J === "background") {
		$K = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($J === "border") {
		$K = border_longhands();
	} else {
		$K = "";
	}
	return $K;
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
		const $L = entry;
		const class2 = $L[0];
		const _declaration = $L[1];
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
		const $H = get2(b[0], key);
		let $I = null;
		if ($H[0] === 0) {
			const entry = $H[1];
			const slot = slot_of(key);
			rules = without_covered(rules, slot[0], slot[1], slot[2]);
			insert(rules, key, entry);
			$I = undefined;
		} else {
			$I = undefined;
		}
		$I;
	}
	return [ rules ];
}
function view(tag) {
	let $E = null;
	if (is_svg_tag(tag)) {
		$E = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$E = [ document.createElement(tag) ];
	}
	return $E;
}
function is_svg_tag(tag) {
	const $C = tag;
	let $D = null;
	if ($C === "svg") {
		$D = true;
	} else if ($C === "path") {
		$D = true;
	} else if ($C === "circle") {
		$D = true;
	} else if ($C === "ellipse") {
		$D = true;
	} else if ($C === "rect") {
		$D = true;
	} else if ($C === "line") {
		$D = true;
	} else if ($C === "polyline") {
		$D = true;
	} else if ($C === "polygon") {
		$D = true;
	} else if ($C === "g") {
		$D = true;
	} else if ($C === "defs") {
		$D = true;
	} else if ($C === "use") {
		$D = true;
	} else if ($C === "symbol") {
		$D = true;
	} else if ($C === "marker") {
		$D = true;
	} else if ($C === "pattern") {
		$D = true;
	} else if ($C === "mask") {
		$D = true;
	} else if ($C === "clipPath") {
		$D = true;
	} else if ($C === "linearGradient") {
		$D = true;
	} else if ($C === "radialGradient") {
		$D = true;
	} else if ($C === "stop") {
		$D = true;
	} else if ($C === "text") {
		$D = true;
	} else if ($C === "tspan") {
		$D = true;
	} else if ($C === "textPath") {
		$D = true;
	} else if ($C === "filter") {
		$D = true;
	} else if ($C === "foreignObject") {
		$D = true;
	} else if ($C === "feGaussianBlur") {
		$D = true;
	} else if ($C === "feColorMatrix") {
		$D = true;
	} else if ($C === "feOffset") {
		$D = true;
	} else if ($C === "feMerge") {
		$D = true;
	} else if ($C === "feMergeNode") {
		$D = true;
	} else if ($C === "feFlood") {
		$D = true;
	} else if ($C === "feComposite") {
		$D = true;
	} else if ($C === "feBlend") {
		$D = true;
	} else if ($C === "feDropShadow") {
		$D = true;
	} else {
		$D = false;
	}
	return $D;
}
function styled(self, style) {
	self[0].setAttribute("class", class_list(style));
	return __clone(self);
}
function on(self, event, handler) {
	self[0].addEventListener(event, () => {
		return turn([ 1 ], ($S) => {
			return (() => {
				return handler($S, [ 1 ]);
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
		let $cv = null;
		if (at + 1 < rows.length) {
			$cv = __at(rows, at + 1, "std/src/browser/web/ui.vl:838:39")[0];
		} else {
			$cv = self[0];
		}
		const end = __clone($cv);
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
		const $cG = step;
		let $cH = null;
		if ($cG[0] === 0) {
			const index = $cG[1];
			const $cI = highest;
			let $cJ = null;
			if ($cI[0] === 0) {
				const top = $cI[1];
				$cJ = index > top;
			} else {
				$cJ = true;
			}
			const rises = $cJ;
			if (rises) {
				highest = [ 0, index ];
				forward_count = forward_count + 1;
				forward.push(true);
			} else {
				forward.push(false);
			}
			$cH = undefined;
		} else {
			forward.push(false);
			$cH = undefined;
		}
		$cH;
	}
	let backward = [  ];
	let backward_count = 0;
	let lowest = steps.length;
	let at = steps.length;
	while (at > 0) {
		at = at - 1;
		const $cK = __at(steps, at, "std/src/browser/web/ui.vl:1475:9");
		let $cL = null;
		if ($cK[0] === 0) {
			const index2 = $cK[1];
			if (index2 < lowest) {
				lowest = index2;
				backward_count = backward_count + 1;
				backward.push(true);
			} else {
				backward.push(false);
			}
			$cL = undefined;
		} else {
			backward.push(false);
			$cL = undefined;
		}
		$cL;
	}
	let $cM = null;
	if (forward_count >= backward_count) {
		$cM = forward;
	} else {
		$cM = reverse(backward);
	}
	return $cM;
}
function row_references(steps, rows, settled, anchor) {
	let references = [  ];
	let reference = __clone(anchor);
	let at = steps.length;
	while (at > 0) {
		at = at - 1;
		references.push(__clone(reference));
		let $cP = null;
		if (__at(settled, at, "std/src/browser/web/ui.vl:1567:6")) {
			const $cN = __at(steps, at, "std/src/browser/web/ui.vl:1568:10");
			let $cO = null;
			if ($cN[0] === 0) {
				const index = $cN[1];
				reference = __clone(__at(rows, index, "std/src/browser/web/ui.vl:1570:18")[0]);
				$cO = undefined;
			} else {
				$cO = undefined;
			}
			$cP = $cO;
		}
		$cP;
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
	const $ev = turn([ 1 ], ($eu) => {
		return comp(body);
	});
	const built = $ev[0];
	const root = $ev[1];
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
function template_option(value, label, $bB, $bC) {
	return child2(attr(view("option"), "value", value, $bB, $bC), label, $bB, $bC);
}
function template_title(name) {
	const $bO = name;
	let $bP = null;
	if ($bO === "counter") {
		$bP = "Counter";
	} else if ($bO === "hello") {
		$bP = "Hello";
	} else if ($bO === "styles") {
		$bP = "Styles";
	} else if ($bO === "server") {
		$bP = "Server";
	} else {
		$bP = name;
	}
	return $bP;
}
function severity_tag(row, $ci, $cj) {
	const $ck = row[1];
	let $cl = null;
	if ($ck === "error") {
		$cl = child2(styled(view("span"), diag_error), "error", $ci, $cj);
	} else {
		$cl = child2(styled(view("span"), diag_warning), "warning", $ci, $cj);
	}
	return $cl;
}
function trace_row(hop, $cm, $cn) {
	let $co = null;
	if (hop[4]) {
		$co = "  via " + hop[0] + ":" + hop[1] + ":" + hop[2] + " \u{2014} " + hop[3];
	} else {
		$co = "  " + hop[3];
	}
	const text = $co;
	return child2(styled(view("div"), diag_trace), text, $cm, $cn);
}
function diagnostic_row(row, $cg, $ch) {
	const head = child(child(child(view("div"), severity_tag(row, $cg, $ch), $cg, $ch), child2(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " ", $cg, $ch), $cg, $ch), child2(view("span"), row[5], $cg, $ch), $cg, $ch);
	let lines = [ head ];
	for (const hop of row[7]) {
		lines.push(trace_row(hop, $cg, $ch));
	}
	if (row[6] !== "") {
		lines.push(child2(styled(view("div"), diag_note), "  note: " + row[6], $cg, $ch));
	}
	const body = child5(view("div"), lines, $cg, $ch);
	const $cp = row[1];
	let $cq = null;
	if ($cp === "error") {
		$cq = child(styled(view("div"), diag_row_error), body, $cg, $ch);
	} else {
		$cq = child(styled(view("div"), diag_row_warning), body, $cg, $ch);
	}
	return $cq;
}
function console_row(row, $dC, $dD) {
	const $dE = row[1];
	let $dF = null;
	if ($dE === "error") {
		$dF = child2(styled(view("div"), console_error), row[2], $dC, $dD);
	} else {
		$dF = child2(styled(view("div"), console_line), row[2], $dC, $dD);
	}
	return $dF;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, can_prelude2, share_label2, mode2, modified_from2, confirm_target2, run2, format2, share2, confirm_replace2, cancel_replace2, $A, $B) {
	return child(child(styled(view("div"), add(add(shell, app_fill), code_palette)), child(child(child(child(child(child(child(child(child(child(child(child(styled(view("header"), app_bar), child(child(attr(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $A, $B), attr(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $A, $B), $A, $B), child2(view("span"), "VILAN", $A, $B), $A, $B), $A, $B), child2(styled(view("h1"), page_title), "Playground", $A, $B), $A, $B), styled(view("div"), rail_divider), $A, $B), child3(on(styled(view("button"), primary_button), "click", ($Q, $R) => {
		return run2();
	}), derive(__clone(mode2), (current, $T, $U, $V) => {
		const $W = current;
		let $X = null;
		if ($W === "node") {
			$X = "Check";
		} else {
			$X = "Run";
		}
		return $X;
	}), $A, $B), $A, $B), child(child(show(attr(attr(styled(view("select"), select_box), "id", "mode", $A, $B), "aria-label", "Compile mode", $A, $B), __clone(can_platform2), $A, $B), template_option("browser", "Browser: compile and run", $A, $B), $A, $B), template_option("node", "Server: check the process leg", $A, $B), $A, $B), $A, $B), child(child(child(show(attr(attr(styled(view("select"), select_box), "id", "prelude", $A, $B), "aria-label", "Ambient scope", $A, $B), __clone(can_prelude2), $A, $B), template_option("on", "Prelude: on", $A, $B), $A, $B), template_option("web", "Prelude: web", $A, $B), $A, $B), template_option("off", "Prelude: off", $A, $B), $A, $B), $A, $B), child2(show(on(styled(view("button"), ghost_button), "click", ($bD, $bE) => {
		return format2();
	}), __clone(can_format2), $A, $B), "Format", $A, $B), $A, $B), child4(on(styled(view("button"), ghost_button), "click", ($bF, $bG) => {
		return share2();
	}), __clone(share_label2), $A, $B), $A, $B), child4(attr(styled(view("p"), status_line), "role", "status", $A, $B), __clone(status2), $A, $B), $A, $B), attr(attr(styled(view("select"), version_select), "id", "version", $A, $B), "aria-label", "Compiler version", $A, $B), $A, $B), styled(view("div"), rail_divider), $A, $B), child2(attr(styled(view("a"), nav_link), "href", "/docs/", $A, $B), "Docs", $A, $B), $A, $B), $A, $B), child(child(child(child(styled(view("main"), quad_grid), child(child(child(styled(view("div"), panel), child(child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Program", $A, $B), $A, $B), child(child(child(child(child(attr(attr(styled(view("select"), select_box), "id", "template", $A, $B), "aria-label", "Load an example", $A, $B), child3(attr(attr(attr(view("option"), "disabled", "true", $A, $B), "hidden", "true", $A, $B), "value", "", $A, $B), derive(__clone(modified_from2), (name, $bJ, $bK, $bL) => {
		const $bM = name;
		let $bN = null;
		if ($bM === "") {
			$bN = "Examples";
		} else {
			$bN = "Modified \u{2014} " + template_title(name);
		}
		return $bN;
	}), $A, $B), $A, $B), template_option("counter", "Counter: reactive state", $A, $B), $A, $B), template_option("hello", "Hello: mount and print", $A, $B), $A, $B), template_option("styles", "Styles: compile-time CSS", $A, $B), $A, $B), show(template_option("server", "Server: typed HTTP, checked", $A, $B), __clone(can_platform2), $A, $B), $A, $B), $A, $B), $A, $B), child(show2(attr(view("div"), "role", "alert", $A, $B), derive(__clone(confirm_target2), (name, $bQ, $bR, $bS) => {
		return name !== "";
	}), $A, $B), child(child(child(styled(view("div"), confirm_bar), child3(styled(view("p"), confirm_question), derive(__clone(confirm_target2), (name, $bV, $bW, $bX) => {
		return "Replace the current program with " + template_title(name) + "? The edits are not kept.";
	}), $A, $B), $A, $B), child2(on(styled(view("button"), ghost_button), "click", ($bY, $bZ) => {
		return cancel_replace2();
	}), "Keep editing", $A, $B), $A, $B), child2(on(styled(view("button"), primary_button), "click", ($ca, $cb) => {
		return confirm_replace2();
	}), "Replace", $A, $B), $A, $B), $A, $B), $A, $B), attr(attr(styled(view("div"), editor_host), "id", "editor", $A, $B), "aria-label", "Program editor", $A, $B), $A, $B), $A, $B), child(child(styled(view("div"), panel), child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Result", $A, $B), $A, $B), $A, $B), attr(attr(styled(view("div"), runner_host), "id", "runner", $A, $B), "aria-label", "Program result", $A, $B), $A, $B), $A, $B), child(child(styled(view("div"), panel), child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Diagnostics", $A, $B), $A, $B), $A, $B), child6(child(styled(view("pre"), report_well), child2(show3(styled(view("div"), quiet_row), derive(__clone(diagnostics2), (rows, $cc, $cd, $ce) => {
		return rows.length === 0;
	}), $A, $B), "Nothing to report.", $A, $B), $A, $B), each_by(__clone(diagnostics2), (row) => {
		return row[0];
	}, (row, $cf) => {
		return diagnostic_row(get(row), $A, $cf);
	}), $A, $B), $A, $B), $A, $B), child(child(styled(view("div"), panel), child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Console", $A, $B), $A, $B), $A, $B), child7(child(styled(view("pre"), report_well), child2(show4(styled(view("div"), quiet_row), derive(__clone(console_lines2), (rows, $dy, $dz, $dA) => {
		return rows.length === 0;
	}), $A, $B), "Program output lands here.", $A, $B), $A, $B), each_by(__clone(console_lines2), (row) => {
		return row[0];
	}, (row, $dB) => {
		return console_row(get(row), $A, $dB);
	}), $A, $B), $A, $B), $A, $B), $A, $B);
}
function new4(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function new5(value) {
	return new4(value);
}
function new6(value) {
	return new4(value);
}
function is_empty(self) {
	return self.length === 0;
}
function last(self) {
	let $f = null;
	if (is_empty(self)) {
		$f = [ 1 ];
	} else {
		$f = __list_get(self, self.length - 1);
	}
	return $f;
}
function notify(self, $b) {
	const $c = $b;
	let $d = null;
	if ($c[0] === 0) {
		const turn2 = $c[1];
		$d = enqueue(turn2, __clone(self[1].v));
	} else {
		const $g = last(draining_turns.v);
		let $h = null;
		if ($g[0] === 0) {
			const draining = $g[1];
			$h = enqueue(draining, __clone(self[1].v));
		} else {
			for (const subscriber of __clone(self[1].v)) {
				if (subscriber[2].v) {
					subscriber[1]();
				}
			}
			$h = undefined;
		}
		$d = $h;
	}
	return $d;
}
function set(self, value, $a) {
	self[0].v = __clone(value);
	notify(self, $a);
}
function notify2(self, $b) {
	const $k = $b;
	let $l = null;
	if ($k[0] === 0) {
		const turn2 = $k[1];
		$l = enqueue(turn2, __clone(self[1].v));
	} else {
		const $m = last(draining_turns.v);
		let $n = null;
		if ($m[0] === 0) {
			const draining = $m[1];
			$n = enqueue(draining, __clone(self[1].v));
		} else {
			for (const subscriber of __clone(self[1].v)) {
				if (subscriber[2].v) {
					subscriber[1]();
				}
			}
			$n = undefined;
		}
		$l = $n;
	}
	return $l;
}
function set2(self, value, $a) {
	self[0].v = __clone(value);
	notify2(self, $a);
}
function set3(self, value, $a) {
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
	const $F = __map_get(self[0], hash(key));
	let $G = null;
	if ($F[0] === 0) {
		const entry = $F[1];
		$G = [ 0, __clone(entry.slice(1, 3)) ];
	} else {
		$G = [ 1 ];
	}
	return $G;
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
function attr(self, name, value, $M, $N) {
	apply(value, self, name, $M, $N);
	return __clone(self);
}
function child(self, content, $O, $P) {
	place(content, self, $O, $P);
	return __clone(self);
}
function child2(self, content, $O, $P) {
	place2(content, self, $O, $P);
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
	const $ax = self;
	return $ax[0] === 1;
}
function run_body(runs, body) {
	const run2 = renew(runs);
	const $aG = nursery(run2);
	let $aH = null;
	if ($aG[0] === 0) {
		const nursery2 = $aG[1];
		$aH = (($aI) => {
			return (($aJ) => {
				return body($aJ, $aI);
			})(nursery2);
		})(run2);
	} else {
		$aH = (() => {
			throw __panic("a renewed run carries its nursery", "std/src/reactive.vl:1318:11");
		})();
	}
	return $aH;
}
function run_once(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = run_body(runs, ($ap, $aq) => {
		return (($ar) => {
			return body($ap, $aq, $ar);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function run_tracked(runs, tracker, body) {
	let value = run_once(runs, tracker, ($ak, $al, $am) => {
		return body($ak, $al, $am);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = run_once(runs, tracker, ($bh, $bi, $bj) => {
			return body($bh, $bi, $bj);
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
		return run_tracked(runs, tracker, ($ah, $ai, $aj) => {
			return transform(value, $ah, $ai, $aj);
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
function sub(self, observer) {
	return observe_flow(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function take(self, item, $bs) {
	defer(self, () => {
		dispose(item, $bs);
		return;
	});
	return __clone(item);
}
function follow(flow, observer, $af, $ag) {
	take(get_owner($ag), sub(flow, observer), $af);
}
function place_text_flow(flow, parent, $aa, $ab) {
	const node = document.createTextNode("");
	parent[0].appendChild(node);
	defer(get_owner($ab), () => {
		return node.remove();
	});
	follow(flow, (value, $ae) => {
		node.textContent = value;
		return;
	}, $aa, $ab);
}
function place4(self, parent, $Y, $Z) {
	place_text_flow(self, parent, $Y, $Z);
}
function child3(self, content, $O, $P) {
	place4(content, self, $O, $P);
	return __clone(self);
}
function observe(signal, observer) {
	const cell = signal[0];
	return attach(signal, mint_subscriber(() => {
		const $bz = [ 0, cell ];
		let $bA = null;
		if ($bz[0] === 0) {
			const live = $bz[1];
			$bA = observer(live.v);
		} else {
			$bA = undefined;
		}
		return $bA;
	}));
}
function attach_observer(self, observer, immediately) {
	const subscription = observe(self, observer);
	if (immediately) {
		observer(get(self));
	}
	return subscription;
}
function sub2(self, observer) {
	return attach_observer(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function follow2(flow, observer, $af, $ag) {
	take(get_owner($ag), sub2(flow, observer), $af);
}
function show(self, condition, $bw, $bx) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	follow2(condition, (visible, $by) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $bw, $bx);
	return __clone(self);
}
function attach_observer2(self, observer, immediately) {
	const subscription = observe(self, observer);
	if (immediately) {
		observer(get(self));
	}
	return subscription;
}
function sub3(self, observer) {
	return attach_observer2(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function follow3(flow, observer, $af, $ag) {
	take(get_owner($ag), sub3(flow, observer), $af);
}
function place_text_flow2(flow, parent, $aa, $ab) {
	const node = document.createTextNode("");
	parent[0].appendChild(node);
	defer(get_owner($ab), () => {
		return node.remove();
	});
	follow3(flow, (value, $ae) => {
		node.textContent = value;
		return;
	}, $aa, $ab);
}
function place5(self, parent, $Y, $Z) {
	place_text_flow2(self, parent, $Y, $Z);
}
function child4(self, content, $O, $P) {
	place5(content, self, $O, $P);
	return __clone(self);
}
function run_body2(runs, body) {
	const run2 = renew(runs);
	const $bT = nursery(run2);
	let $bU = null;
	if ($bT[0] === 0) {
		const nursery2 = $bT[1];
		$bU = (($aI) => {
			return (($aJ) => {
				return body($aJ, $aI);
			})(nursery2);
		})(run2);
	} else {
		$bU = (() => {
			throw __panic("a renewed run carries its nursery", "std/src/reactive.vl:1318:11");
		})();
	}
	return $bU;
}
function run_once2(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = run_body2(runs, ($ap, $aq) => {
		return (($ar) => {
			return body($ap, $aq, $ar);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function run_tracked2(runs, tracker, body) {
	let value = run_once2(runs, tracker, ($ak, $al, $am) => {
		return body($ak, $al, $am);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = run_once2(runs, tracker, ($bh, $bi, $bj) => {
			return body($bh, $bi, $bj);
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
		return run_tracked2(runs, tracker, ($ah, $ai, $aj) => {
			return transform(value, $ah, $ai, $aj);
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
function observe_flow2(flow, observer, immediately) {
	const instance = start3(flow);
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
function sub4(self, observer) {
	return observe_flow2(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function follow4(flow, observer, $af, $ag) {
	take(get_owner($ag), sub4(flow, observer), $af);
}
function show2(self, condition, $bw, $bx) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	follow4(condition, (visible, $by) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $bw, $bx);
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
		return run_tracked2(runs, tracker, ($ah, $ai, $aj) => {
			return transform(value, $ah, $ai, $aj);
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
function observe_flow3(flow, observer, immediately) {
	const instance = start5(flow);
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
function sub5(self, observer) {
	return observe_flow3(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function follow5(flow, observer, $af, $ag) {
	take(get_owner($ag), sub5(flow, observer), $af);
}
function show3(self, condition, $bw, $bx) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	follow5(condition, (visible, $by) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $bw, $bx);
	return __clone(self);
}
function child5(self, content, $O, $P) {
	place3(content, self, $O, $P);
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
		span.push(__clone(__at(held.v, index, "std/src/browser/web/ui.vl:1510:13")));
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
		const canonical = hash2(__at(old_keys, build, "std/src/reactive.vl:3677:19"));
		__at_put(next_same, build, __map_get(first, canonical), "std/src/reactive.vl:3678:3");
		first.set(canonical, build);
	}
	let steps = [  ];
	for (const item of items) {
		const item_key = key_of(item);
		const canonical2 = hash2(item_key);
		let head = __map_get(first, canonical2);
		let advancing = true;
		while (advancing) {
			const $cx = head;
			let $cy = null;
			if ($cx[0] === 0) {
				const at = $cx[1];
				if (__at(claimed, at, "std/src/reactive.vl:3694:9")) {
					head = __at(next_same, at, "std/src/reactive.vl:3695:14");
				} else {
					advancing = false;
				}
				$cy = undefined;
			} else {
				$cy = advancing = false;
			}
			$cy;
		}
		const $cz = head;
		let $cA = null;
		if ($cz[0] === 0) {
			const at2 = $cz[1];
			$cA = first.set(canonical2, at2);
		} else {
			$cA = first.delete(canonical2);
		}
		$cA;
		let found = [ 1 ];
		let walk = head;
		let walking = true;
		while (walking) {
			const $cB = walk;
			let $cC = null;
			if ($cB[0] === 0) {
				const at3 = $cB[1];
				if (!(__at(claimed, at3, "std/src/reactive.vl:3713:10")) && __at(old_keys, at3, "std/src/reactive.vl:3713:25") === item_key) {
					found = [ 0, at3 ];
					walking = false;
				} else {
					walk = __at(next_same, at3, "std/src/reactive.vl:3720:14");
				}
				$cC = undefined;
			} else {
				$cC = walking = false;
			}
			$cC;
		}
		let step = [ 2 ];
		const $cD = found;
		if ($cD[0] === 0) {
			__at_put(claimed, $cD[1], true, "std/src/reactive.vl:3728:4");
			let $cE = null;
			if (same(__at(old_items, $cD[1], "std/src/reactive.vl:3729:19"), item)) {
				$cE = [ 0, $cD[1] ];
			} else {
				$cE = [ 1, $cD[1] ];
			}
			step = $cE;
		}
		steps.push(step);
	}
	let removed = [  ];
	let index = 0;
	while (index < held) {
		if (!(__at(claimed, index, "std/src/reactive.vl:3736:7"))) {
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
function open_row_before(self, content, end, $df, $dg) {
	const marker = document.createTextNode("");
	host(self).insertBefore(marker, end);
	const staging = document.createDocumentFragment();
	place(content, [ __clone(staging) ], $df, $dg);
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
	const $dl = delta_cursor(self);
	let $dm = null;
	if ($dl[0] === 0) {
		const cursor = $dl[1];
		$dm = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return delta_since(self, cursor);
		}, () => {
			return drop_delta_cursor(self, cursor);
		} ];
	} else {
		$dm = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return [ [ 2, get(self) ] ];
		}, () => {
			return;
		} ];
	}
	return $dm;
}
function live_ops(ops) {
	let last2 = [ 1 ];
	let index = 0;
	for (const op of ops) {
		const $dn = op;
		let $do = null;
		if ($dn[0] === 2) {
			const _items = $dn[1];
			last2 = [ 0, index ];
			$do = undefined;
		} else {
			$do = undefined;
		}
		$do;
		index = index + 1;
	}
	const $dp = last2;
	let $dq = null;
	if ($dp[0] === 0 && $dp[1] > 0) {
		$dq = $dp[1];
	} else {
		return __clone(ops);
	}
	const from = $dq;
	let live = [  ];
	index = from;
	while (index < ops.length) {
		live.push(__at(ops, index, "std/src/browser/web/ui.vl:1542:13"));
		index = index + 1;
	}
	return live;
}
function place_each_by(parent, source, key, render, $ct, $cu) {
	const region = open(parent);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_cells = __shared_new([  ]);
	const row_rows = region[2];
	const row_owners = __shared_new([  ]);
	defer(get_owner($cu), () => {
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
		let $cw = null;
		if (at + count < row_rows.v.length) {
			$cw = __at(row_rows.v, at + count, "std/src/browser/web/ui.vl:1932:4")[0];
		} else {
			$cw = region[0];
		}
		const boundary = __clone($cw);
		const same = (_before, _after) => {
			return true;
		};
		let $cF = null;
		if (whole) {
			$cF = reconcile(__clone(row_keys.v), __clone(row_items.v), list, key, same);
		} else {
			$cF = reconcile(held_span(row_keys, at, count), held_span(row_items, at, count), list, key, same);
		}
		const plan = $cF;
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
			let $cS = null;
			if (__at(settled, settled_at, "std/src/browser/web/ui.vl:1957:7")) {
				const $cQ = step;
				let $cR = null;
				if ($cQ[0] === 0) {
					const index = $cQ[1];
					__at_put(staying, index, true, "std/src/browser/web/ui.vl:1960:7");
					$cR = undefined;
				} else {
					$cR = undefined;
				}
				$cS = $cR;
			}
			$cS;
			settled_at = settled_at + 1;
		}
		let cut = [  ];
		let index2 = 0;
		for (const row of previous_rows) {
			if (__at(staying, index2, "std/src/browser/web/ui.vl:1972:7")) {
				cut.push([ 1 ]);
			} else {
				let $cT = null;
				if (index2 + 1 < previous_rows.length) {
					$cT = __at(previous_rows, index2 + 1, "std/src/browser/web/ui.vl:1976:6")[0];
				} else {
					$cT = boundary;
				}
				const end = __clone($cT);
				cut.push([ 0, cut_row(region, row, end) ]);
			}
			index2 = index2 + 1;
		}
		for (const gone of plan[1]) {
			dispose2(__at(previous_owners, gone, "std/src/browser/web/ui.vl:1985:4"));
			drop_row(region, __at(previous_rows, gone, "std/src/browser/web/ui.vl:1986:20"));
		}
		let next_cells = [  ];
		let next_rows = [  ];
		let next_owners = [  ];
		let position = 0;
		for (const step2 of plan[0]) {
			const item = __clone(__at(list, position, "std/src/browser/web/ui.vl:1993:15"));
			const reference = __clone(__at(references, position, "std/src/browser/web/ui.vl:1994:20"));
			const $cU = step2;
			let $cV = null;
			if ($cU[0] === 0) {
				const kept = $cU[1];
				const cell = __clone(__at(previous_cells, kept, "std/src/browser/web/ui.vl:1997:17"));
				set3(cell, item, $ct);
				next_cells.push(cell);
				const $da = __at(cut, kept, "std/src/browser/web/ui.vl:2000:12");
				let $db = null;
				if ($da[0] === 0) {
					const content = __clone($da[1]);
					insert_row(region, __at(previous_rows, kept, "std/src/browser/web/ui.vl:2002:26"), content, reference);
					$db = undefined;
				} else {
					$db = undefined;
				}
				$db;
				next_rows.push(__clone(__at(previous_rows, kept, "std/src/browser/web/ui.vl:2006:21")));
				next_owners.push(__clone(__at(previous_owners, kept, "std/src/browser/web/ui.vl:2007:23")));
				$cV = undefined;
			} else if ($cU[0] === 1) {
				const kept2 = $cU[1];
				const cell2 = __clone(__at(previous_cells, kept2, "std/src/browser/web/ui.vl:2013:17"));
				set3(cell2, item, $ct);
				next_cells.push(cell2);
				const $dc = __at(cut, kept2, "std/src/browser/web/ui.vl:2016:12");
				let $dd = null;
				if ($dc[0] === 0) {
					const content2 = __clone($dc[1]);
					insert_row(region, __at(previous_rows, kept2, "std/src/browser/web/ui.vl:2018:26"), content2, reference);
					$dd = undefined;
				} else {
					$dd = undefined;
				}
				$dd;
				next_rows.push(__clone(__at(previous_rows, kept2, "std/src/browser/web/ui.vl:2022:21")));
				next_owners.push(__clone(__at(previous_owners, kept2, "std/src/browser/web/ui.vl:2023:23")));
				$cV = undefined;
			} else {
				const cell3 = new4(item);
				const owner = new3();
				next_cells.push(__clone(cell3));
				next_rows.push(run_with_owner(owner, ($de) => {
					return open_row_before(region, render(cell3, $de), reference, $ct, $de);
				}));
				next_owners.push(owner);
				$cV = undefined;
			}
			$cV;
			position = position + 1;
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		let $dh = null;
		if (whole) {
			hold_rows(region, next_rows);
			row_keys.v = next_keys;
			row_items.v = __clone(list);
			row_cells.v = next_cells;
			row_owners.v = next_owners;
		} else {
			let taken = 0;
			while (taken < count) {
				__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2054:33");
				__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2055:37");
				__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2056:35");
				__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2057:33");
				__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2058:35");
				taken = taken + 1;
			}
			let offset = 0;
			while (offset < next_rows.length) {
				__insert_at(row_rows.v, at + offset, __clone(__at(next_rows, offset, "std/src/browser/web/ui.vl:2063:42")), "std/src/browser/web/ui.vl:2063:22");
				__insert_at(row_owners.v, at + offset, __clone(__at(next_owners, offset, "std/src/browser/web/ui.vl:2064:44")), "std/src/browser/web/ui.vl:2064:24");
				__insert_at(row_cells.v, at + offset, __clone(__at(next_cells, offset, "std/src/browser/web/ui.vl:2065:43")), "std/src/browser/web/ui.vl:2065:23");
				__insert_at(row_keys.v, at + offset, __clone(__at(next_keys, offset, "std/src/browser/web/ui.vl:2066:42")), "std/src/browser/web/ui.vl:2066:22");
				__insert_at(row_items.v, at + offset, __clone(__at(list, offset, "std/src/browser/web/ui.vl:2067:43")), "std/src/browser/web/ui.vl:2067:23");
				offset = offset + 1;
			}
			$dh = undefined;
		}
		return $dh;
	};
	const reconcile_pass = (list) => {
		return reconcile_span(0, row_rows.v.length, list);
	};
	const splice_rows = (at, removed, inserted) => {
		let taken = 0;
		while (taken < removed) {
			let $di = null;
			if (at + 1 < row_rows.v.length) {
				$di = __at(row_rows.v, at + 1, "std/src/browser/web/ui.vl:2082:5")[0];
			} else {
				$di = region[0];
			}
			const end = __clone($di);
			const going = __clone(__at(row_rows.v, at, "std/src/browser/web/ui.vl:2086:16"));
			cut_row(region, going, end);
			dispose2(__at(row_owners.v, at, "std/src/browser/web/ui.vl:2088:4"));
			drop_row(region, going);
			__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2090:32");
			__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2091:36");
			__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2092:34");
			__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2093:32");
			__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2094:34");
			taken = taken + 1;
		}
		let $dj = null;
		if (at < row_rows.v.length) {
			$dj = __at(row_rows.v, at, "std/src/browser/web/ui.vl:2098:4")[0];
		} else {
			$dj = region[0];
		}
		const reference = __clone($dj);
		let offset = 0;
		for (const item of inserted) {
			const cell = new4(__clone(item));
			const owner = new3();
			const row = run_with_owner(owner, ($dk) => {
				return open_row_before(region, render(cell, $dk), reference, $ct, $dk);
			});
			__insert_at(row_rows.v, at + offset, row, "std/src/browser/web/ui.vl:2107:21");
			__insert_at(row_owners.v, at + offset, owner, "std/src/browser/web/ui.vl:2108:23");
			__insert_at(row_cells.v, at + offset, __clone(cell), "std/src/browser/web/ui.vl:2109:22");
			__insert_at(row_keys.v, at + offset, key(item), "std/src/browser/web/ui.vl:2110:21");
			__insert_at(row_items.v, at + offset, __clone(item), "std/src/browser/web/ui.vl:2111:22");
			offset = offset + 1;
		}
		return;
	};
	const instance = open_rows(source);
	const drain2 = instance[2];
	const handle = instance[1](subscriber_of(() => {
		for (const op of live_ops(drain2())) {
			const $dr = op;
			let $ds = null;
			if ($dr[0] === 0) {
				const at = $dr[1];
				const removed = $dr[2];
				const inserted = $dr[3];
				if (removed.length === 0 || inserted.length === 0) {
					splice_rows(at, removed.length, inserted);
				} else {
					reconcile_span(at, removed.length, inserted);
				}
				$ds = undefined;
			} else if ($dr[0] === 1) {
				const at2 = $dr[1];
				const _was = $dr[2];
				const value = $dr[3];
				const $dt = __list_get(row_keys.v, at2);
				let $du = null;
				if ($dt[0] === 0) {
					const held = $dt[1];
					$du = key(value) === held;
				} else {
					$du = false;
				}
				const same_key = $du;
				let $dx = null;
				if (same_key) {
					const $dv = __list_get(row_cells.v, at2);
					let $dw = null;
					if ($dv[0] === 0) {
						const cell = $dv[1];
						__at_put(row_items.v, at2, __clone(value), "std/src/browser/web/ui.vl:2145:9");
						set3(cell, value, $ct);
						$dw = undefined;
					} else {
						$dw = undefined;
					}
					$dx = $dw;
				} else {
					splice_rows(at2, 1, [ __clone(value) ]);
				}
				$ds = $dx;
			} else if ($dr[0] === 2) {
				const items = $dr[1];
				$ds = reconcile_pass(items);
			} else {
				const from = $dr[1];
				const count = $dr[2];
				const to = $dr[3];
				let moved = __clone(row_items.v);
				let lifted = [  ];
				let taken = 0;
				while (taken < count) {
					lifted.push(__remove_at(moved, from, "std/src/browser/web/ui.vl:2164:25"));
					taken = taken + 1;
				}
				let offset = 0;
				for (const item of lifted) {
					__insert_at(moved, to + offset, __clone(item), "std/src/browser/web/ui.vl:2169:13");
					offset = offset + 1;
				}
				reconcile_pass(moved);
				$ds = undefined;
			}
			$ds;
		}
		return;
	}, false));
	also_releasing(handle, instance[3]);
	take(get_owner($cu), handle, $ct);
	reconcile_pass(instance[0]());
}
function place6(self, parent, $cr, $cs) {
	place_each_by(parent, __clone(self[0]), self[1], self[2], $cr, $cs);
}
function child6(self, content, $O, $P) {
	place6(content, self, $O, $P);
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
		return run_tracked2(runs, tracker, ($ah, $ai, $aj) => {
			return transform(value, $ah, $ai, $aj);
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
function observe_flow4(flow, observer, immediately) {
	const instance = start7(flow);
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
function sub6(self, observer) {
	return observe_flow4(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function follow6(flow, observer, $af, $ag) {
	take(get_owner($ag), sub6(flow, observer), $af);
}
function show4(self, condition, $bw, $bx) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	follow6(condition, (visible, $by) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $bw, $bx);
	return __clone(self);
}
function open_rows2(self) {
	const $eh = delta_cursor(self);
	let $ei = null;
	if ($eh[0] === 0) {
		const cursor = $eh[1];
		$ei = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return delta_since(self, cursor);
		}, () => {
			return drop_delta_cursor(self, cursor);
		} ];
	} else {
		$ei = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return [ [ 2, get(self) ] ];
		}, () => {
			return;
		} ];
	}
	return $ei;
}
function place_each_by2(parent, source, key, render, $ct, $cu) {
	const region = open(parent);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_cells = __shared_new([  ]);
	const row_rows = region[2];
	const row_owners = __shared_new([  ]);
	defer(get_owner($cu), () => {
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
		let $dG = null;
		if (at + count < row_rows.v.length) {
			$dG = __at(row_rows.v, at + count, "std/src/browser/web/ui.vl:1932:4")[0];
		} else {
			$dG = region[0];
		}
		const boundary = __clone($dG);
		const same = (_before, _after) => {
			return true;
		};
		let $dP = null;
		if (whole) {
			$dP = reconcile(__clone(row_keys.v), __clone(row_items.v), list, key, same);
		} else {
			$dP = reconcile(held_span(row_keys, at, count), held_span(row_items, at, count), list, key, same);
		}
		const plan = $dP;
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
			let $dS = null;
			if (__at(settled, settled_at, "std/src/browser/web/ui.vl:1957:7")) {
				const $dQ = step;
				let $dR = null;
				if ($dQ[0] === 0) {
					const index = $dQ[1];
					__at_put(staying, index, true, "std/src/browser/web/ui.vl:1960:7");
					$dR = undefined;
				} else {
					$dR = undefined;
				}
				$dS = $dR;
			}
			$dS;
			settled_at = settled_at + 1;
		}
		let cut = [  ];
		let index2 = 0;
		for (const row of previous_rows) {
			if (__at(staying, index2, "std/src/browser/web/ui.vl:1972:7")) {
				cut.push([ 1 ]);
			} else {
				let $dT = null;
				if (index2 + 1 < previous_rows.length) {
					$dT = __at(previous_rows, index2 + 1, "std/src/browser/web/ui.vl:1976:6")[0];
				} else {
					$dT = boundary;
				}
				const end = __clone($dT);
				cut.push([ 0, cut_row(region, row, end) ]);
			}
			index2 = index2 + 1;
		}
		for (const gone of plan[1]) {
			dispose2(__at(previous_owners, gone, "std/src/browser/web/ui.vl:1985:4"));
			drop_row(region, __at(previous_rows, gone, "std/src/browser/web/ui.vl:1986:20"));
		}
		let next_cells = [  ];
		let next_rows = [  ];
		let next_owners = [  ];
		let position = 0;
		for (const step2 of plan[0]) {
			const item = __clone(__at(list, position, "std/src/browser/web/ui.vl:1993:15"));
			const reference = __clone(__at(references, position, "std/src/browser/web/ui.vl:1994:20"));
			const $dU = step2;
			let $dV = null;
			if ($dU[0] === 0) {
				const kept = $dU[1];
				const cell = __clone(__at(previous_cells, kept, "std/src/browser/web/ui.vl:1997:17"));
				set3(cell, item, $ct);
				next_cells.push(cell);
				const $ea = __at(cut, kept, "std/src/browser/web/ui.vl:2000:12");
				let $eb = null;
				if ($ea[0] === 0) {
					const content = __clone($ea[1]);
					insert_row(region, __at(previous_rows, kept, "std/src/browser/web/ui.vl:2002:26"), content, reference);
					$eb = undefined;
				} else {
					$eb = undefined;
				}
				$eb;
				next_rows.push(__clone(__at(previous_rows, kept, "std/src/browser/web/ui.vl:2006:21")));
				next_owners.push(__clone(__at(previous_owners, kept, "std/src/browser/web/ui.vl:2007:23")));
				$dV = undefined;
			} else if ($dU[0] === 1) {
				const kept2 = $dU[1];
				const cell2 = __clone(__at(previous_cells, kept2, "std/src/browser/web/ui.vl:2013:17"));
				set3(cell2, item, $ct);
				next_cells.push(cell2);
				const $ec = __at(cut, kept2, "std/src/browser/web/ui.vl:2016:12");
				let $ed = null;
				if ($ec[0] === 0) {
					const content2 = __clone($ec[1]);
					insert_row(region, __at(previous_rows, kept2, "std/src/browser/web/ui.vl:2018:26"), content2, reference);
					$ed = undefined;
				} else {
					$ed = undefined;
				}
				$ed;
				next_rows.push(__clone(__at(previous_rows, kept2, "std/src/browser/web/ui.vl:2022:21")));
				next_owners.push(__clone(__at(previous_owners, kept2, "std/src/browser/web/ui.vl:2023:23")));
				$dV = undefined;
			} else {
				const cell3 = new4(item);
				const owner = new3();
				next_cells.push(__clone(cell3));
				next_rows.push(run_with_owner(owner, ($de) => {
					return open_row_before(region, render(cell3, $de), reference, $ct, $de);
				}));
				next_owners.push(owner);
				$dV = undefined;
			}
			$dV;
			position = position + 1;
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		let $ee = null;
		if (whole) {
			hold_rows(region, next_rows);
			row_keys.v = next_keys;
			row_items.v = __clone(list);
			row_cells.v = next_cells;
			row_owners.v = next_owners;
		} else {
			let taken = 0;
			while (taken < count) {
				__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2054:33");
				__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2055:37");
				__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2056:35");
				__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2057:33");
				__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2058:35");
				taken = taken + 1;
			}
			let offset = 0;
			while (offset < next_rows.length) {
				__insert_at(row_rows.v, at + offset, __clone(__at(next_rows, offset, "std/src/browser/web/ui.vl:2063:42")), "std/src/browser/web/ui.vl:2063:22");
				__insert_at(row_owners.v, at + offset, __clone(__at(next_owners, offset, "std/src/browser/web/ui.vl:2064:44")), "std/src/browser/web/ui.vl:2064:24");
				__insert_at(row_cells.v, at + offset, __clone(__at(next_cells, offset, "std/src/browser/web/ui.vl:2065:43")), "std/src/browser/web/ui.vl:2065:23");
				__insert_at(row_keys.v, at + offset, __clone(__at(next_keys, offset, "std/src/browser/web/ui.vl:2066:42")), "std/src/browser/web/ui.vl:2066:22");
				__insert_at(row_items.v, at + offset, __clone(__at(list, offset, "std/src/browser/web/ui.vl:2067:43")), "std/src/browser/web/ui.vl:2067:23");
				offset = offset + 1;
			}
			$ee = undefined;
		}
		return $ee;
	};
	const reconcile_pass = (list) => {
		return reconcile_span(0, row_rows.v.length, list);
	};
	const splice_rows = (at, removed, inserted) => {
		let taken = 0;
		while (taken < removed) {
			let $ef = null;
			if (at + 1 < row_rows.v.length) {
				$ef = __at(row_rows.v, at + 1, "std/src/browser/web/ui.vl:2082:5")[0];
			} else {
				$ef = region[0];
			}
			const end = __clone($ef);
			const going = __clone(__at(row_rows.v, at, "std/src/browser/web/ui.vl:2086:16"));
			cut_row(region, going, end);
			dispose2(__at(row_owners.v, at, "std/src/browser/web/ui.vl:2088:4"));
			drop_row(region, going);
			__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2090:32");
			__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2091:36");
			__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2092:34");
			__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2093:32");
			__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2094:34");
			taken = taken + 1;
		}
		let $eg = null;
		if (at < row_rows.v.length) {
			$eg = __at(row_rows.v, at, "std/src/browser/web/ui.vl:2098:4")[0];
		} else {
			$eg = region[0];
		}
		const reference = __clone($eg);
		let offset = 0;
		for (const item of inserted) {
			const cell = new4(__clone(item));
			const owner = new3();
			const row = run_with_owner(owner, ($dk) => {
				return open_row_before(region, render(cell, $dk), reference, $ct, $dk);
			});
			__insert_at(row_rows.v, at + offset, row, "std/src/browser/web/ui.vl:2107:21");
			__insert_at(row_owners.v, at + offset, owner, "std/src/browser/web/ui.vl:2108:23");
			__insert_at(row_cells.v, at + offset, __clone(cell), "std/src/browser/web/ui.vl:2109:22");
			__insert_at(row_keys.v, at + offset, key(item), "std/src/browser/web/ui.vl:2110:21");
			__insert_at(row_items.v, at + offset, __clone(item), "std/src/browser/web/ui.vl:2111:22");
			offset = offset + 1;
		}
		return;
	};
	const instance = open_rows2(source);
	const drain2 = instance[2];
	const handle = instance[1](subscriber_of(() => {
		for (const op of live_ops(drain2())) {
			const $en = op;
			let $eo = null;
			if ($en[0] === 0) {
				const at = $en[1];
				const removed = $en[2];
				const inserted = $en[3];
				if (removed.length === 0 || inserted.length === 0) {
					splice_rows(at, removed.length, inserted);
				} else {
					reconcile_span(at, removed.length, inserted);
				}
				$eo = undefined;
			} else if ($en[0] === 1) {
				const at2 = $en[1];
				const _was = $en[2];
				const value = $en[3];
				const $ep = __list_get(row_keys.v, at2);
				let $eq = null;
				if ($ep[0] === 0) {
					const held = $ep[1];
					$eq = key(value) === held;
				} else {
					$eq = false;
				}
				const same_key = $eq;
				let $et = null;
				if (same_key) {
					const $er = __list_get(row_cells.v, at2);
					let $es = null;
					if ($er[0] === 0) {
						const cell = $er[1];
						__at_put(row_items.v, at2, __clone(value), "std/src/browser/web/ui.vl:2145:9");
						set3(cell, value, $ct);
						$es = undefined;
					} else {
						$es = undefined;
					}
					$et = $es;
				} else {
					splice_rows(at2, 1, [ __clone(value) ]);
				}
				$eo = $et;
			} else if ($en[0] === 2) {
				const items = $en[1];
				$eo = reconcile_pass(items);
			} else {
				const from = $en[1];
				const count = $en[2];
				const to = $en[3];
				let moved = __clone(row_items.v);
				let lifted = [  ];
				let taken = 0;
				while (taken < count) {
					lifted.push(__remove_at(moved, from, "std/src/browser/web/ui.vl:2164:25"));
					taken = taken + 1;
				}
				let offset = 0;
				for (const item of lifted) {
					__insert_at(moved, to + offset, __clone(item), "std/src/browser/web/ui.vl:2169:13");
					offset = offset + 1;
				}
				reconcile_pass(moved);
				$eo = undefined;
			}
			$eo;
		}
		return;
	}, false));
	also_releasing(handle, instance[3]);
	take(get_owner($cu), handle, $ct);
	reconcile_pass(instance[0]());
}
function place7(self, parent, $cr, $cs) {
	place_each_by2(parent, __clone(self[0]), self[1], self[2], $cr, $cs);
}
function child7(self, content, $O, $P) {
	place7(content, self, $O, $P);
	return __clone(self);
}
function comp(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, scope ];
}
function set_with(self, transform, $eD) {
	set3(self, transform(get(self)), $eD);
}
const minting_derivation = __shared_new(false);
const next_subscriber_id = __shared_new(0);
const draining_turns = __shared_new([  ]);
const releasing_turns = __shared_new([  ]);
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
const status = new5("Loading the compiler\u{2026}");
const diagnostics = new6([  ]);
const console_lines = new6([  ]);
const can_format = new6(false);
const can_platform = new6(false);
const can_prelude = new6(false);
const mode = new5("browser");
const share_label = new5("Share");
const next_row_id = __shared_new(0);
const modified_from = new5("");
const buffer_dirty = __shared_new(false);
const run_token = __shared_new("");
const confirm_target = new5("");
const run = () => {
	if (VilanPlayground.compile(VilanPlayground.value())) {
		set(status, "Compiling\u{2026}", [ 1 ]);
	} else {
		set(status, "Compiler busy; queued.", [ 1 ]);
	}
	return;
};
const format = () => {
	if (!(VilanPlayground.format())) {
		set(status, "Compiler busy; try again.", [ 1 ]);
	}
	return;
};
const share = () => {
	return VilanPlayground.share();
};
const load_example = (name) => {
	const $i = name;
	let $j = null;
	if ($i === "server") {
		$j = "node";
	} else {
		$j = "browser";
	}
	const platform = $j;
	VilanPlayground.setMode(platform);
	VilanPlayground.setPrelude("on");
	VilanPlayground.setDoc(VilanPlayground.example(name));
	set2(diagnostics, [  ], [ 1 ]);
	set3(console_lines, [  ], [ 1 ]);
	run();
	return;
};
const pick = (name) => {
	if (buffer_dirty.v) {
		set(confirm_target, name, [ 1 ]);
	} else {
		load_example(name);
	}
	return;
};
const confirm_replace = () => {
	const name = get(confirm_target);
	set(confirm_target, "", [ 1 ]);
	if (name !== "") {
		load_example(name);
	}
	return;
};
const cancel_replace = () => {
	return set(confirm_target, "", [ 1 ]);
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
	set(share_label, label, [ 1 ]);
	const $s = share_revert.v;
	let $t = null;
	if ($s[0] === 0) {
		const timer = $s[1];
		$t = cancel(timer);
	} else {
		$t = undefined;
	}
	$t;
	const timer2 = after(1600);
	share_revert.v = [ 0, __clone(timer2) ];
	__task(async () => {
		if (await (wait(timer2, [ 1 ]))) {
			set(share_label, "Share", [ 1 ]);
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
	set2(diagnostics, rows, [ 1 ]);
	return rows.length;
};
mount_root("app", ($z) => {
	return playground_page(status, diagnostics, console_lines, can_format, can_platform, can_prelude, share_label, mode, modified_from, confirm_target, run, format, share, confirm_replace, cancel_replace, [ 1 ], $z);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $eA = null;
	if (kind === "ready") {
		set3(can_format, event.canFormat, [ 1 ]);
		set3(can_platform, event.canPlatform, [ 1 ]);
		if (!(event.canPlatform)) {
			VilanPlayground.setMode("browser");
		}
		set3(can_prelude, event.canPrelude, [ 1 ]);
		if (!(event.canPrelude)) {
			VilanPlayground.setPrelude("on");
		}
		set(status, "Ready (vilan " + event.version + ")", [ 1 ]);
		compiler_ready.v = true;
		run_on_arrival();
	} else if (kind === "doc") {
		doc_ready.v = true;
		run_on_arrival();
	} else if (kind === "dirty") {
		buffer_dirty.v = event.changed;
		set(modified_from, event.name, [ 1 ]);
		if (!(event.changed)) {
			set(confirm_target, "", [ 1 ]);
		}
		$eA = undefined;
	} else if (kind === "command") {
		const command = event.command;
		if (command === "run") {
			run();
		} else if (command === "format") {
			format();
		} else if (command === "pick") {
			pick(event.name);
		} else if (command === "mode") {
			set(mode, event.name, [ 1 ]);
		}
		$eA = undefined;
	} else if (kind === "formatted") {
		const declined = event.declined;
		if (declined !== "") {
			set(status, "Format left the buffer unchanged \u{2014} " + declined, [ 1 ]);
		} else if (event.changed) {
			set(status, "Formatted.", [ 1 ]);
		} else {
			set(status, "Format made no changes.", [ 1 ]);
		}
		$eA = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			set(status, "Link copied to the clipboard.", [ 1 ]);
			flash_share("Copied!");
		} else {
			set(status, "Link ready in the address bar.", [ 1 ]);
			flash_share("Link ready");
		}
		$eA = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $eB = null;
		if (event.ok) {
			if (event.platform === "node") {
				set(status, "No problems (server check, vilan " + event.version + ").", [ 1 ]);
			} else {
				set(status, "No problems (vilan " + event.version + ").", [ 1 ]);
			}
			$eB = undefined;
		} else if (count === 1) {
			set(status, "1 problem; see the diagnostics.", [ 1 ]);
		} else {
			set(status, "" + count + " problems; see the diagnostics.", [ 1 ]);
		}
		$eA = $eB;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $eC = null;
		if (event.platform === "node") {
			if (event.ok) {
				set(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ]);
			} else {
				set(status, "Build failed; see the diagnostics.", [ 1 ]);
			}
			$eC = undefined;
		} else {
			set3(console_lines, [  ], [ 1 ]);
			if (event.ok) {
				set(status, "Compiled (vilan " + event.version + ")", [ 1 ]);
				const token = crypto.randomUUID();
				run_token.v = token;
				VilanPlayground.runProgram(event.js, event.css, token);
			} else {
				set(status, "Build failed; see the diagnostics.", [ 1 ]);
				run_token.v = "";
				VilanPlayground.clearProgram();
			}
			$eC = undefined;
		}
		$eA = $eC;
	} else if (kind === "crash") {
		set(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $eA;
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
