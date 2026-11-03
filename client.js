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
function __dom_run_holds(nodes, node) {
	for (let walk = node; walk !== null; walk = walk.parentNode) {
		if (nodes.has(walk)) return true;
	}
	return false;
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
function __nmap_get(table, hash) {
	const entry = table[0].get(hash);
	return entry !== undefined && entry[1][0] === 0 ? [ 0, __clone(entry[1][1]) ] : [ 1 ];
}
function __nmap_insert(table, hash, key, value) {
	__nmap_settle(table);
	const entry = table[0].get(hash);
	if (entry === undefined) table[0].set(hash, [ key, [ 0, value ] ]);
	else {
		entry[0] = key;
		if (entry[1][0] !== 0 || entry[1][1] !== value) entry[1] = [ 0, value ];
	}
}
function __nmap_keys(table) {
	const out = [];
	for (const entry of table[0].values()) if (entry[1][0] === 0) out.push(entry[0]);
	return out.map(__clone);
}
function __nmap_remove(table, hash) {
	__nmap_settle(table);
	table[0].delete(hash);
}
function __nmap_settle(table) {
	const hash = table[1];
	if (hash === undefined) return;
	table[1] = undefined;
	const entry = table[0].get(hash);
	if (entry !== undefined && entry[1][0] === 1) table[0].delete(hash);
}
function __nmap_values(table) {
	const out = [];
	for (const entry of table[0].values()) if (entry[1][0] === 0) out.push(entry[1][1]);
	return out.map(__clone);
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
		let $al = null;
		if (subscriber[3]) {
			if (!(turn2[3].v.has(key))) {
				turn2[3].v.set(key, true);
				if (tracing.v) {
					trace_hooks.v[3](turn2, subscriber[0]);
				}
				turn2[1].v.push(__clone(subscriber));
			}
			$al = undefined;
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
		$al;
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
	const $bR = turn2;
	let $bS = null;
	if ($bR[0] === 0) {
		const ambient = $bR[1];
		$bS = enqueue(ambient, [ reissued(subscriber) ]);
	} else {
		const $bT = last(draining_turns.v);
		let $bU = null;
		if ($bT[0] === 0) {
			const draining = $bT[1];
			$bU = enqueue(draining, [ reissued(subscriber) ]);
		} else {
			if (subscriber[2].v) {
				subscriber[1]();
			}
			$bU = undefined;
		}
		$bS = $bU;
	}
	return $bS;
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
	const $bY = last2(releasing_turns.v);
	let $bZ = null;
	if ($bY[0] === 0) {
		const at_release = $bY[1];
		$bZ = at_release;
	} else {
		$bZ = last(draining_turns.v);
	}
	const turn2 = $bZ;
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
		if (tracing.v) {
			trace_hooks.v[7](turn2, handle[1]);
		}
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
		releasing_turns.v.push(__clone(ambient));
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
	const $bp = self[0].v[3];
	let $bq = null;
	if ($bp[0] === 0) {
		const nursery2 = __clone($bp[1]);
		let $br = null;
		if (has_spawned(nursery2)) {
			$br = [ 1 ];
		} else {
			$br = [ 0, nursery2 ];
		}
		$bq = $br;
	} else {
		$bq = [ 1 ];
	}
	const carried = $bq;
	advance([ self[0], self[0].v[0] ], carried);
	if (is_none(self[0].v[3])) {
		run_nurseries_allocated_count.v = run_nurseries_allocated_count.v + 1;
		self[0].v[3] = [ 0, detached_nursery() ];
	}
	return [ self[0], self[0].v[0] ];
}
function nursery(self) {
	let $bC = null;
	if (is_disposed(self)) {
		$bC = [ 1 ];
	} else {
		$bC = self[0].v[3];
	}
	return $bC;
}
function dispose2(self) {
	advance(self, [ 1 ]);
}
function advance(self, carried) {
	let $bB = null;
	if (!(is_disposed(self))) {
		const held = self[0].v;
		self[0].v = [ self[1] + 1, no_cleanups, false, __clone(carried) ];
		const $bs = held[3];
		let $bt = null;
		if ($bs[0] === 0) {
			const nursery2 = $bs[1];
			if (is_none(carried)) {
				nursery2.cancel();
			}
			$bt = undefined;
		} else {
			$bt = undefined;
		}
		$bt;
		let $bA = null;
		if (held[2]) {
			let failure = [ 1 ];
			for (const cleanup of held[1].v) {
				const $bv = __guarded(cleanup);
				let $bw = null;
				if ($bv[0] === 0) {
					const message = $bv[1];
					if (is_none(failure)) {
						failure = [ 0, message ];
					}
					$bw = undefined;
				} else {
					$bw = undefined;
				}
				$bw;
			}
			const $by = failure;
			let $bz = null;
			if ($by[0] === 0) {
				const message2 = $by[1];
				$bz = (() => {
					throw __panic(message2, "std/src/reactive.vl:1294:27");
				})();
			} else {
				$bz = undefined;
			}
			$bA = $bz;
		}
		$bB = $bA;
	}
	return $bB;
}
function get_owner($t) {
	return $t;
}
function release_runs(runs) {
	dispose2([ runs[0], runs[0].v[0] ]);
}
function new_tracker(site) {
	return [ __shared_new([ 0, false, false, false, false, [ 1 ], [ 1 ], site ]) ];
}
function open_run(tracker) {
	const epoch = tracker[0].v[0] + 1;
	tracker[0].v[0] = epoch;
	tracker[0].v[1] = true;
	tracker[0].v[2] = false;
	const $bk = tracker[0].v[6];
	let $bl = null;
	if ($bk[0] === 0) {
		const lists = $bk[1];
		if (!(is_empty(lists.v[0]))) {
			lists.v[0] = [  ];
		}
		$bl = undefined;
	} else {
		$bl = undefined;
	}
	$bl;
	return [ __clone(tracker), epoch ];
}
function close_run(tracker) {
	tracker[0].v[1] = false;
	const $bH = tracker[0].v[6];
	let $bI = null;
	if ($bH[0] === 0) {
		const lists = $bH[1];
		$bI = lists;
	} else {
		return;
		$bI = undefined;
	}
	const lists2 = $bI;
	const $bJ = tracker[0].v[5];
	let $bK = null;
	if ($bJ[0] === 0) {
		const target2 = __clone($bJ[1]);
		$bK = reconnect(tracker, lists2, target2);
	} else {
		if (!(is_empty(lists2.v[0])) || !(is_empty(lists2.v[1]))) {
			lists2.v[1] = __clone(lists2.v[0]);
		}
		$bK = undefined;
	}
	$bK;
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
		const $bP = reusable(held, kept, dependency[0], position);
		let $bQ = null;
		if ($bP[0] === 0) {
			const index = $bP[1];
			__at_put(kept, index, true, "std/src/reactive.vl:1715:5");
			next.push(__clone(__at(held, index, "std/src/reactive.vl:1716:15")));
			$bQ = undefined;
		} else {
			next.push([ __clone(dependency[0]), dependency[1](relay_for(tracker, target2)) ]);
			$bQ = undefined;
		}
		$bQ;
		position = position + 1;
	}
	lists.v[2] = next;
	let index2 = 0;
	for (const edge of held) {
		if (!(__at(kept, index2, "std/src/reactive.vl:1730:7"))) {
			detach(edge[1]);
		}
		index2 = index2 + 1;
	}
	tracker[0].v[3] = false;
}
function reusable(held, kept, identity, position) {
	const $bL = identity;
	let $bM = null;
	if ($bL[0] === 0) {
		const wanted = $bL[1];
		if (position < held.length && !(__at(kept, position, "std/src/reactive.vl:1753:9")) && same_identity(__at(held, position, "std/src/reactive.vl:1754:22")[0], wanted)) {
			return [ 0, position ];
		}
		let index = 0;
		while (index < held.length) {
			if (!(__at(kept, index, "std/src/reactive.vl:1759:9")) && same_identity(__at(held, index, "std/src/reactive.vl:1759:38")[0], wanted)) {
				return [ 0, index ];
			}
			index = index + 1;
		}
		$bM = [ 1 ];
	} else {
		$bM = [ 1 ];
	}
	return $bM;
}
function same_identity(identity, wanted) {
	const $bN = identity;
	let $bO = null;
	if ($bN[0] === 0) {
		const held = $bN[1];
		$bO = held === wanted;
	} else {
		$bO = false;
	}
	return $bO;
}
function relay_for(tracker, target2) {
	const relay = subscriber_of(() => {
		const connecting = tracker[0].v[3];
		tracker[0].v[2] = true;
		if (connecting) {
			tracker[0].v[4] = true;
		} else {
			wake(target2);
		}
		return;
	}, true);
	const $bV = tracker[0].v[7];
	let $bW = null;
	if ($bV[0] === 0) {
		const site = __clone($bV[1]);
		$bW = place_subscriber(relay[0], site);
	} else {
		$bW = undefined;
	}
	$bW;
	return relay;
}
function attach_tracker(tracker, target2) {
	tracker[0].v[5] = [ 0, __clone(target2) ];
	const $cd = tracker[0].v[6];
	let $ce = null;
	if ($cd[0] === 0) {
		const lists = $cd[1];
		$ce = lists;
	} else {
		return;
		$ce = undefined;
	}
	const lists2 = $ce;
	let $cf = null;
	if (!(is_empty(lists2.v[1]))) {
		const read = __clone(lists2.v[1]);
		lists2.v[1] = [  ];
		tracker[0].v[3] = true;
		let edges = [  ];
		for (const dependency of read) {
			edges.push([ __clone(dependency[0]), dependency[1](relay_for(tracker, target2)) ]);
		}
		lists2.v[2] = edges;
		tracker[0].v[3] = false;
		if (tracker[0].v[4]) {
			tracker[0].v[4] = false;
			wake(target2);
		}
		$cf = undefined;
	}
	return $cf;
}
function forget_reads(tracker) {
	const $cg = tracker[0].v[6];
	let $ch = null;
	if ($cg[0] === 0) {
		const lists = $cg[1];
		$ch = lists;
	} else {
		return;
		$ch = undefined;
	}
	const lists2 = $ch;
	let $ci = null;
	if (!(is_empty(lists2.v[2]))) {
		const edges = __clone(lists2.v[2]);
		lists2.v[2] = [  ];
		for (const edge of edges) {
			detach(edge[1]);
		}
		$ci = undefined;
	}
	$ci;
	if (!(is_empty(lists2.v[1]))) {
		lists2.v[1] = [  ];
	}
}
function detach_tracker(tracker) {
	tracker[0].v[5] = [ 1 ];
	forget_reads(tracker);
}
function place_subscriber(id, site) {
	if (tracing.v) {
		trace_hooks.v[8](id, site);
	}
}
function place_subscription(subscription, site) {
	if (tracing.v) {
		trace_hooks.v[8](subscription[1], site);
	}
	return subscription;
}
function also_releasing(handle, release) {
	const previous = __clone(handle[3].v);
	handle[3].v = [ 0, () => {
		release();
		const $cj = previous;
		let $ck = null;
		if ($cj[0] === 0) {
			const earlier = $cj[1];
			$ck = earlier();
		} else {
			$ck = undefined;
		}
		return $ck;
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
function on_teardown(cleanup) {
	if (__hmr_active()) {
		__hmr_register_teardown(cleanup);
	}
}
function slot_of(key) {
	const parts = key.split(":");
	if (parts.length !== 3) {
		(() => {
			throw __panic("this style\'s slot key is not one media:condition:property triple (got \"" + key + "\"" + ") \u{2014} every field that reaches a key is fenced against \':\' where it is written, so a key holding another one means a condition token was minted carrying the key\'s own separator; that is the bug, not this read", "std/src/web/style.vl:1305:3");
		})();
	}
	return [ __at(parts, 0, "std/src/web/style.vl:1307:17"), __at(parts, 1, "std/src/web/style.vl:1307:39"), __at(parts, 2, "std/src/web/style.vl:1307:60") ];
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
		const $I = get2(b[0], key);
		let $J = null;
		if ($I[0] === 0) {
			const entry = $I[1];
			const slot = slot_of(key);
			rules = without_covered(rules, slot[0], slot[1], slot[2]);
			insert(rules, key, entry);
			$J = undefined;
		} else {
			$J = undefined;
		}
		$J;
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
function is_leaving(node) {
	let at = 0;
	while (at < leaving_runs.v.length) {
		if (__dom_run_holds(__at(leaving_runs.v, at, "std/src/browser/web/ui.vl:975:16"), node)) {
			return true;
		}
		at = at + 1;
	}
	return false;
}
function place(self, parent, caller) {
	parent[0].appendChild(self[0]);
}
function place2(self, parent, caller) {
	parent[0].appendChild(document.createTextNode(self));
}
function place3(self, parent, caller) {
	for (const item of self) {
		parent[0].appendChild(item[0]);
	}
}
function apply(self, parent, name, caller) {
	parent[0].setAttribute(name, self);
}
function mount_target(id) {
	const element = document.getElementById(id);
	if (__is_null(element)) {
		(() => {
			throw __panic("mount: no element with id \'" + id + "\'", "std/src/browser/web/ui.vl:2553:3");
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
	const $dw = turn([ 1 ], ($dv) => {
		return comp(body);
	});
	const built = $dw[0];
	const root = $dw[1];
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
function diagram($cR, $cS) {
	return child(child(child(child(child(child(child(child(styled(view("div"), art_stage), styled(view("div"), dg_blob_top), $cR, $cS, "src/art.vl:299:2"), styled(view("div"), dg_blob_left), $cR, $cS, "src/art.vl:299:2"), styled(view("div"), dg_blob_right), $cR, $cS, "src/art.vl:299:2"), grain(), $cR, $cS, "src/art.vl:299:2"), child(child(styled(view("div"), dg_source), child2(styled(view("p"), art_tab), "notes.vl \u{b7} one source", $cR, $cS, "src/art.vl:305:4"), $cR, $cS, "src/art.vl:304:3"), child(child(child(child(child(child(child(child(child(styled(view("div"), art_code), ln([ t("[", $cR, $cS), kw("service", $cR, $cS), t("(NotesClient)]", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:306:4"), ln([ kw("struct", $cR, $cS), t(" Notes {", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:306:4"), ln([ t("    [", $cR, $cS), kw("expose", $cR, $cS), t("] entries: SignalCell<List<Note>>,", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:306:4"), ln([ t("}", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:306:4"), blank($cR, $cS), $cR, $cS, "src/art.vl:306:4"), ln([ kw("impl", $cR, $cS), t(" Notes {", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:306:4"), ln([ t("    [", $cR, $cS), kw("rpc", $cR, $cS), t("]", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:306:4"), ln([ t("    ", $cR, $cS), kw("fun", $cR, $cS), t(" add(self, text: str): i32 { \u{2026} }", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:306:4"), ln([ t("}", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:306:4"), $cR, $cS, "src/art.vl:304:3"), $cR, $cS, "src/art.vl:299:2"), child(child(child(child(styled(view("div"), dg_wire_zone), styled(view("div"), dg_wire_left), $cR, $cS, "src/art.vl:318:3"), styled(view("div"), dg_wire_right), $cR, $cS, "src/art.vl:318:3"), child2(styled(view("span"), dg_wire_label_left), "vilan build", $cR, $cS, "src/art.vl:321:4"), $cR, $cS, "src/art.vl:318:3"), child2(styled(view("span"), dg_wire_label_right), "vilan build", $cR, $cS, "src/art.vl:322:4"), $cR, $cS, "src/art.vl:318:3"), $cR, $cS, "src/art.vl:299:2"), child(child(child(styled(view("div"), dg_legs), child(child(styled(view("div"), art_card), child(child(child(styled(view("div"), dg_leg_head), styled(view("div"), dot_magenta), $cR, $cS, "src/art.vl:326:5"), child2(styled(view("span"), dg_leg_name), "the server", $cR, $cS, "src/art.vl:328:6"), $cR, $cS, "src/art.vl:326:5"), child2(styled(view("span"), dg_leg_env), "node", $cR, $cS, "src/art.vl:329:6"), $cR, $cS, "src/art.vl:326:5"), $cR, $cS, "src/art.vl:325:4"), child(child(styled(view("div"), art_code), ln([ t("serve_service(4000,", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:331:5"), ln([ t("    notes.dispatcher() \u{2026})", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:331:5"), $cR, $cS, "src/art.vl:325:4"), $cR, $cS, "src/art.vl:324:3"), child(child(styled(view("div"), dg_mid), child(child(view("div"), child2(styled(view("p"), dg_mid_label), "notes.add(\"ship it\")", $cR, $cS, "src/art.vl:338:6"), $cR, $cS, "src/art.vl:337:5"), child(child(styled(view("div"), dg_line_row), styled(view("div"), arrow_head_left), $cR, $cS, "src/art.vl:339:6"), styled(view("div"), dg_line), $cR, $cS, "src/art.vl:339:6"), $cR, $cS, "src/art.vl:337:5"), $cR, $cS, "src/art.vl:336:4"), child(child(child(view("div"), child(child(styled(view("div"), dg_line_row), styled(view("div"), dg_line_dashed), $cR, $cS, "src/art.vl:345:6"), styled(view("div"), arrow_head_right_rose), $cR, $cS, "src/art.vl:345:6"), $cR, $cS, "src/art.vl:344:5"), child2(styled(view("p"), dg_mid_label_rose), "entries", $cR, $cS, "src/art.vl:349:6"), $cR, $cS, "src/art.vl:344:5"), child2(styled(view("p"), dg_note), "mirrored live", $cR, $cS, "src/art.vl:350:6"), $cR, $cS, "src/art.vl:344:5"), $cR, $cS, "src/art.vl:336:4"), $cR, $cS, "src/art.vl:324:3"), child(child(styled(view("div"), art_card), child(child(child(styled(view("div"), dg_leg_head), styled(view("div"), dot_orange), $cR, $cS, "src/art.vl:354:5"), child2(styled(view("span"), dg_leg_name), "the client", $cR, $cS, "src/art.vl:356:6"), $cR, $cS, "src/art.vl:354:5"), child2(styled(view("span"), dg_leg_env), "browser", $cR, $cS, "src/art.vl:357:6"), $cR, $cS, "src/art.vl:354:5"), $cR, $cS, "src/art.vl:353:4"), child(child(styled(view("div"), art_code), ln([ kw("let", $cR, $cS), t(" notes = NotesClient::connect(", $cR, $cS), st("\"/rpc\"", $cR, $cS), t(");", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:359:5"), ln([ t("notes.entries ", $cR, $cS), t("// Signal, live", $cR, $cS) ], $cR, $cS), $cR, $cS, "src/art.vl:359:5"), $cR, $cS, "src/art.vl:353:4"), $cR, $cS, "src/art.vl:324:3"), $cR, $cS, "src/art.vl:299:2"), child2(styled(view("p"), art_caption), "one definition: the compiler builds both sides and keeps them honest", $cR, $cS, "src/art.vl:365:3"), $cR, $cS, "src/art.vl:299:2");
}
function editor_art($dh, $di) {
	return child(child(child(child(styled(view("div"), art_stage), styled(view("div"), ed_blob_a), $dh, $di, "src/art.vl:496:2"), styled(view("div"), ed_blob_b), $dh, $di, "src/art.vl:496:2"), grain(), $dh, $di, "src/art.vl:496:2"), child(child(child(child(styled(view("div"), ed_window), child(child(child(child(styled(view("div"), ed_titlebar), styled(view("div"), ed_dot_red), $dh, $di, "src/art.vl:501:4"), styled(view("div"), ed_dot_orange), $dh, $di, "src/art.vl:501:4"), styled(view("div"), ed_dot_magenta), $dh, $di, "src/art.vl:501:4"), child2(styled(view("span"), ed_title), "app.vl \u{2014} vilan", $dh, $di, "src/art.vl:505:5"), $dh, $di, "src/art.vl:501:4"), $dh, $di, "src/art.vl:500:3"), child(child(styled(view("div"), ed_body), child2(styled(view("div"), ed_gutter), "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11", $dh, $di, "src/art.vl:508:5"), $dh, $di, "src/art.vl:507:4"), child(child(child(child(child(child(child(child(child(child(child(styled(view("div"), ed_code), ln([ kw("import", $dh, $di), t(" std::io::print;", $dh, $di) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), ln([ kw("import", $dh, $di), t(" std::option::Option::{ self, Some, None };", $dh, $di) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), ln([ kw("fun", $dh, $di), t(" find_user(id: i32): Option<str> {", $dh, $di) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), ln([ t("    ", $dh, $di), kw("if", $dh, $di), t(" id == 1 { Some(", $dh, $di), st("\"Ada\"", $dh, $di), t(") } ", $dh, $di), kw("else", $dh, $di), t(" { None }", $dh, $di) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), ln([ t("}", $dh, $di) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), ln([ kw("fun", $dh, $di), t(" greet(name: str): str {", $dh, $di) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), ln([ t("    ", $dh, $di), st("i\"hello {name}\"", $dh, $di) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), ln([ t("}", $dh, $di) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), ln([ kw("fun", $dh, $di), t(" main() {", $dh, $di) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), ln([ t("    print(greet(", $dh, $di), child2(styled(view("span"), ed_squiggle), "find_user(2)", $dh, $di, "src/art.vl:529:7"), t("));", $dh, $di), styled(view("span"), ed_caret) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), ln([ t("}", $dh, $di) ], $dh, $di), $dh, $di, "src/art.vl:509:5"), $dh, $di, "src/art.vl:507:4"), $dh, $di, "src/art.vl:500:3"), child(child(child(styled(view("div"), ed_statusbar), child2(styled(view("span"), ed_problem), "\u{2297} 1", $dh, $di, "src/art.vl:537:5"), $dh, $di, "src/art.vl:536:4"), child2(view("span"), "vilan-lsp", $dh, $di, "src/art.vl:538:5"), $dh, $di, "src/art.vl:536:4"), child2(styled(view("span"), ed_status_right), "Ln 10, Col 17 \u{b7} app.vl", $dh, $di, "src/art.vl:539:5"), $dh, $di, "src/art.vl:536:4"), $dh, $di, "src/art.vl:500:3"), child(child(styled(view("div"), ed_hover), child2(styled(view("div"), ed_hover_error), "Expected str, but got Option<str> instead.", $dh, $di, "src/art.vl:542:5"), $dh, $di, "src/art.vl:541:4"), child2(styled(view("div"), ed_hover_from), "vilan \u{b7} live as you type", $dh, $di, "src/art.vl:543:5"), $dh, $di, "src/art.vl:541:4"), $dh, $di, "src/art.vl:500:3"), $dh, $di, "src/art.vl:496:2");
}
function tc_chip_at(left, top, color, label, $aG, $aH) {
	return child(child(attr(styled(view("div"), tc_chip), "style", "left: " + left + "; top: " + top, $aG, $aH, "src/art.vl:680:2"), attr(styled(view("div"), led), "style", "background: " + color, $aG, $aH, "src/art.vl:681:3"), $aG, $aH, "src/art.vl:680:2"), child2(view("span"), label, $aG, $aH, "src/art.vl:682:3"), $aG, $aH, "src/art.vl:680:2");
}
function toolchain_art($aE, $aF) {
	return child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(styled(view("div"), tc_wrap), styled(view("div"), tc_blob_b), $aE, $aF, "src/art.vl:687:2"), styled(view("div"), tc_blob_a), $aE, $aF, "src/art.vl:687:2"), styled(view("div"), tc_blob_c), $aE, $aF, "src/art.vl:687:2"), grain(), $aE, $aF, "src/art.vl:687:2"), styled(view("div"), tc_spoke_up), $aE, $aF, "src/art.vl:687:2"), styled(view("div"), tc_spoke_down), $aE, $aF, "src/art.vl:687:2"), styled(view("div"), tc_spoke_run), $aE, $aF, "src/art.vl:687:2"), styled(view("div"), tc_spoke_fmt), $aE, $aF, "src/art.vl:687:2"), styled(view("div"), tc_spoke_lsp), $aE, $aF, "src/art.vl:687:2"), styled(view("div"), tc_spoke_upgrade), $aE, $aF, "src/art.vl:687:2"), styled(view("div"), tc_center_mask), $aE, $aF, "src/art.vl:687:2"), attr(attr(styled(view("div"), tc_center), "aria-label", "vilan", $aE, $aF, "src/art.vl:699:3"), "role", "img", $aE, $aF, "src/art.vl:699:3"), $aE, $aF, "src/art.vl:687:2"), tc_chip_at("210px", "70px", primary[0], "vilan build", $aE, $aF), $aE, $aF, "src/art.vl:687:2"), tc_chip_at("328px", "142px", "#D84730", "vilan run --watch", $aE, $aF), $aE, $aF, "src/art.vl:687:2"), tc_chip_at("344px", "288px", accent[0], "vilan fmt", $aE, $aF), $aE, $aF, "src/art.vl:687:2"), tc_chip_at("210px", "360px", "#B23056", "vilan test", $aE, $aF), $aE, $aF, "src/art.vl:687:2"), tc_chip_at("78px", "288px", "#8B2786", "vilan-lsp", $aE, $aF), $aE, $aF, "src/art.vl:687:2"), tc_chip_at("82px", "142px", "#672283", "vilan upgrade", $aE, $aF), $aE, $aF, "src/art.vl:687:2");
}
function df_arrow_to(label, $cL, $cM) {
	return child(child(styled(view("div"), df_arrow), child2(styled(view("span"), df_arrow_label), label, $cL, $cM, "src/art.vl:784:3"), $cL, $cM, "src/art.vl:783:2"), child(child(styled(view("div"), df_arrow_row), styled(view("div"), dg_line), $cL, $cM, "src/art.vl:785:3"), styled(view("div"), arrow_head_right), $cL, $cM, "src/art.vl:785:3"), $cL, $cM, "src/art.vl:783:2");
}
function df_node_view(lit, tag, body, $cH, $cI) {
	const $cK = view("div");
	let $cJ = null;
	if (lit) {
		$cJ = df_node_lit;
	} else {
		$cJ = df_node;
	}
	return child(child(styled($cK, $cJ), child2(styled(view("p"), df_tag), tag, $cH, $cI, "src/art.vl:794:3"), $cH, $cI, "src/art.vl:793:2"), child(styled(view("div"), art_code), ln(body, $cH, $cI), $cH, $cI, "src/art.vl:795:3"), $cH, $cI, "src/art.vl:793:2");
}
function dataflow_art($cF, $cG) {
	return child(child(child(child(child(styled(view("div"), df_wrap), styled(view("div"), df_blob_a), $cF, $cG, "src/art.vl:800:2"), styled(view("div"), df_blob_b), $cF, $cG, "src/art.vl:800:2"), grain(), $cF, $cG, "src/art.vl:800:2"), child(child(child(child(child(styled(view("div"), df_row), df_node_view(false, "the write", [ t("count.set(", $cF, $cG), st("2", $cF, $cG), t(")", $cF, $cG) ], $cF, $cG), $cF, $cG, "src/art.vl:804:3"), df_arrow_to("notify", $cF, $cG), $cF, $cG, "src/art.vl:804:3"), df_node_view(false, "the signal", [ t("SignalCell<i32> ", $cF, $cG), kw("= 2", $cF, $cG) ], $cF, $cG), $cF, $cG, "src/art.vl:804:3"), df_arrow_to("re-set", $cF, $cG), $cF, $cG, "src/art.vl:804:3"), df_node_view(true, "the one text node", [ t("<p>clicked ", $cF, $cG), kw("2", $cF, $cG), t(" times</p>", $cF, $cG) ], $cF, $cG), $cF, $cG, "src/art.vl:804:3"), $cF, $cG, "src/art.vl:800:2"), child2(styled(view("p"), art_caption), "no virtual DOM, no re-render: the subscription updates exactly one node", $cF, $cG, "src/art.vl:811:3"), $cF, $cG, "src/art.vl:800:2");
}
function kw(text, $cn, $co) {
	return child2(styled(view("span"), tk_keyword), text, $cn, $co, "src/code.vl:58:2");
}
function st(text, $cx, $cy) {
	return child2(styled(view("span"), tk_string), text, $cx, $cy, "src/code.vl:62:2");
}
function t(text, $cp, $cq) {
	return child2(styled(view("span"), tk_plain), text, $cp, $cq, "src/code.vl:66:2");
}
function fn(text, $cr, $cs) {
	return child2(styled(view("span"), tk_callable), text, $cr, $cs, "src/code.vl:71:2");
}
function ty(text, $cv, $cw) {
	return child2(styled(view("span"), tk_type), text, $cv, $cw, "src/code.vl:76:2");
}
function hl(text, $cz, $cA) {
	return child2(styled(view("span"), tk_hole), text, $cz, $cA, "src/code.vl:81:2");
}
function ln(spans, $ct, $cu) {
	return child4(view("div"), __clone(spans), $ct, $cu, "src/code.vl:85:2");
}
function blank($cT, $cU) {
	return child2(view("div"), " ", $cT, $cU, "src/code.vl:89:2");
}
function code_panel(lines, $cB, $cC) {
	return child4(styled(view("pre"), code_pre), __clone(lines), $cB, $cC, "src/code.vl:93:2");
}
function leaf(text, $Z, $aa) {
	return child2(styled(view("code"), leaf_style), text, $Z, $aa, "src/code.vl:117:2");
}
function leaf_link(href, text, $cP, $cQ) {
	return child2(attr(styled(view("a"), leaf_link_style), "href", href, $cP, $cQ, "src/code.vl:121:2"), text, $cP, $cQ, "src/code.vl:121:2");
}
function pt(text, $X, $Y) {
	return child2(view("span"), text, $X, $Y, "src/code.vl:126:2");
}
function bloom($i, $j) {
	return child(styled(view("div"), bloom_field), child(child(styled(view("div"), bloom_drift), child(styled(view("div"), bloom_blurwrap), styled(view("div"), bloom_gradient), $i, $j, "src/masthead.vl:112:4"), $i, $j, "src/masthead.vl:111:3"), styled(view("div"), bloom_duo), $i, $j, "src/masthead.vl:111:3"), $i, $j, "src/masthead.vl:110:2");
}
function hero($Q, $R) {
	return child(child(child(child(styled(view("header"), hero_block), child2(styled(view("h1"), visually_hidden), "Vilan \u{2014} The Modern Web Language", $Q, $R, "src/masthead.vl:160:3"), $Q, $R, "src/masthead.vl:159:2"), attr(attr(styled(view("img"), hero_mark), "src", "" + assets + "/dark_logo_flat.svg", $Q, $R, "src/masthead.vl:161:3"), "alt", "", $Q, $R, "src/masthead.vl:161:3"), $Q, $R, "src/masthead.vl:159:2"), attr(attr(styled(view("img"), hero_wordmark), "src", "" + assets + "/wordmark_hero.svg", $Q, $R, "src/masthead.vl:162:3"), "alt", "VILAN", $Q, $R, "src/masthead.vl:162:3"), $Q, $R, "src/masthead.vl:159:2"), child2(attr(styled(view("p"), hero_tagline), "aria-hidden", "true", $Q, $R, "src/masthead.vl:163:3"), "The Modern Web Language", $Q, $R, "src/masthead.vl:163:3"), $Q, $R, "src/masthead.vl:159:2");
}
function masthead($O, $P) {
	return child(styled(view("div"), masthead_wrap), hero($O, $P), $O, $P, "src/masthead.vl:168:2");
}
function page(scroll_fade2, copy, $b, $c, $d) {
	return child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(child(styled(view("div"), shell), bloom($b, $c), $b, $c, "src/page.vl:82:2"), top_bar(scroll_fade2, $b, $c), $b, $c, "src/page.vl:82:2"), masthead($b, $c), $b, $c, "src/page.vl:82:2"), divider($b, $c), $b, $c, "src/page.vl:82:2"), install_section(copy, $b, $c, $d), $b, $c, "src/page.vl:82:2"), divider($b, $c), $b, $c, "src/page.vl:82:2"), showcase_reactive($b, $c), $b, $c, "src/page.vl:82:2"), divider($b, $c), $b, $c, "src/page.vl:82:2"), showcase_fullstack($b, $c), $b, $c, "src/page.vl:82:2"), divider($b, $c), $b, $c, "src/page.vl:82:2"), showcase_compiler($b, $c), $b, $c, "src/page.vl:82:2"), divider($b, $c), $b, $c, "src/page.vl:82:2"), editor_band($b, $c), $b, $c, "src/page.vl:82:2"), divider($b, $c), $b, $c, "src/page.vl:82:2"), feature_grid($b, $c), $b, $c, "src/page.vl:82:2"), divider($b, $c), $b, $c, "src/page.vl:82:2"), dogfood($b, $c), $b, $c, "src/page.vl:82:2"), page_footer($b, $c), $b, $c, "src/page.vl:82:2");
}
function install_row(label, command, copy, $ab, $ac, $ad) {
	const icon = new5("" + assets + "/icons/copy.svg", "src/page.vl:180:21");
	const pending = __shared_new([ 1 ]);
	return child(child(view("div"), child2(styled(view("p"), install_label), label, $ab, $ac, "src/page.vl:185:3"), $ab, $ac, "src/page.vl:184:2"), child(child(styled(view("div"), install_command), child2(styled(view("span"), install_command_text), command, $ab, $ac, "src/page.vl:187:4"), $ab, $ac, "src/page.vl:186:3"), child(on(attr(styled(view("button"), copy_button), "aria-label", "Copy command", $ab, $ac, "src/page.vl:188:4"), "click", ($ae, $af) => {
		copy(command);
		set(icon, "" + assets + "/icons/check.svg", [ 0, $ae ], "src/page.vl:193:11");
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
			if (await (wait(timer2, $ad))) {
				set(icon, "" + assets + "/icons/copy.svg", [ 0, $ae ], "src/page.vl:202:13");
			}
			return;
		}, "install_row", __nursery_of($ad));
		return;
	}), bind_attr(attr(styled(view("img"), copy_icon), "alt", "", $ab, $ac, "src/page.vl:207:5"), "src", __clone(icon), $ab, $ac, "src/page.vl:207:38"), $ab, $ac, "src/page.vl:188:4"), $ab, $ac, "src/page.vl:186:3"), $ab, $ac, "src/page.vl:184:2");
}
function install_section(copy, $U, $V, $W) {
	return child(child(child(styled(attr(view("section"), "id", "install", $U, $V, "src/page.vl:214:2"), add(add(column, section_block), stack)), child2(styled(view("h2"), heading), "One command, the whole toolchain", $U, $V, "src/page.vl:215:3"), $U, $V, "src/page.vl:214:2"), child(child(child(styled(view("p"), lead), pt("The compiler, dev server with hot reload, formatter, test runner, and language server live in one small binary. There is nothing else to install and nothing to configure. Update any time with ", $U, $V), $U, $V, "src/page.vl:216:3"), leaf("vilan upgrade", $U, $V), $U, $V, "src/page.vl:216:3"), pt(".", $U, $V), $U, $V, "src/page.vl:216:3"), $U, $V, "src/page.vl:214:2"), child(child(styled(view("div"), install_split), child(child(child(styled(view("div"), install_grid), install_row("macOS / Linux", "curl -fsSL https://github.com/vilan-lang/vilan/releases/latest/download/install.sh | sh", copy, $U, $V, $W), $U, $V, "src/page.vl:222:4"), install_row("Windows (PowerShell)", "irm https://github.com/vilan-lang/vilan/releases/latest/download/install.ps1 | iex", copy, $U, $V, $W), $U, $V, "src/page.vl:222:4"), install_row("Homebrew", "brew install vilan-lang/vilan/vilan", copy, $U, $V, $W), $U, $V, "src/page.vl:222:4"), $U, $V, "src/page.vl:221:3"), child(styled(view("div"), install_art_cell), toolchain_art($U, $V), $U, $V, "src/page.vl:235:4"), $U, $V, "src/page.vl:221:3"), $U, $V, "src/page.vl:214:2");
}
function showcase(prose, code, $cD, $cE) {
	return child(child(styled(view("div"), showcase_grid), __clone(prose), $cD, $cE, "src/page.vl:262:2"), __clone(code), $cD, $cE, "src/page.vl:262:2");
}
function showcase_flipped(code, prose, $dd, $de) {
	return child(child(styled(view("div"), showcase_grid_flipped), __clone(code), $dd, $de, "src/page.vl:271:2"), __clone(prose), $dd, $de, "src/page.vl:271:2");
}
function counter_demo($aK, $aL) {
	const count = new6(0, "src/page.vl:310:22");
	return child(child(styled(view("div"), demo_box), child2(on(styled(view("button"), demo_button), "click", ($aM, $aN) => {
		return set_with(count, (n) => {
			return n + 1;
		}, [ 0, $aM ]);
	}), "+1", $aK, $aL, "src/page.vl:312:3"), $aK, $aL, "src/page.vl:311:2"), child3(styled(view("p"), demo_label), derive(__clone(count), (n, $aW, $aX, $aY) => {
		return "clicked " + n + " times";
	}, "src/page.vl:313:33"), $aK, $aL, "src/page.vl:313:3"), $aK, $aL, "src/page.vl:311:2");
}
function reactive_snippet($cl, $cm) {
	return code_panel([ ln([ kw("fun", $cl, $cm), t(" ", $cl, $cm), fn("main", $cl, $cm), t("() {", $cl, $cm) ], $cl, $cm), ln([ t("    ", $cl, $cm), kw("let", $cl, $cm), t(" count = ", $cl, $cm), ty("Signal", $cl, $cm), t("::", $cl, $cm), fn("new", $cl, $cm), t("(", $cl, $cm), st("0", $cl, $cm), t(");", $cl, $cm) ], $cl, $cm), ln([ t("    ", $cl, $cm), kw("let", $cl, $cm), t(" _root = ui::", $cl, $cm), fn("mount_root", $cl, $cm), t("(", $cl, $cm), st("\"app\"", $cl, $cm), t(", ||", $cl, $cm) ], $cl, $cm), ln([ t("        <", $cl, $cm), ty("div", $cl, $cm), t(">", $cl, $cm) ], $cl, $cm), ln([ t("            <", $cl, $cm), ty("p", $cl, $cm), t(">{count.", $cl, $cm), fn("derive", $cl, $cm), t("(|n: i32| ", $cl, $cm), st("i\"clicked ", $cl, $cm), hl("{", $cl, $cm), t("n", $cl, $cm), hl("}", $cl, $cm), st(" times\"", $cl, $cm), t(")}</", $cl, $cm), ty("p", $cl, $cm), t(">", $cl, $cm) ], $cl, $cm), ln([ t("            <", $cl, $cm), ty("button", $cl, $cm), t(" ", $cl, $cm), fn("on:click", $cl, $cm), t("(|| count.", $cl, $cm), fn("set_with", $cl, $cm), t("(|n| n + ", $cl, $cm), st("1", $cl, $cm), t("))>", $cl, $cm), st("\"+1\"", $cl, $cm), t("</", $cl, $cm), ty("button", $cl, $cm), t(">", $cl, $cm) ], $cl, $cm), ln([ t("        </", $cl, $cm), ty("div", $cl, $cm), t(">);", $cl, $cm) ], $cl, $cm), ln([ t("}", $cl, $cm) ], $cl, $cm) ], $cl, $cm);
}
function showcase_reactive($aI, $aJ) {
	const prose = child(child(child(child(styled(view("div"), showcase_copy), child2(styled(view("h2"), heading), "UI that follows your data", $aI, $aJ, "src/page.vl:383:3"), $aI, $aJ, "src/page.vl:382:14"), child(child(child(styled(view("p"), lead), pt("A view is a value and a binding is a subscription: a ", $aI, $aJ), $aI, $aJ, "src/page.vl:384:3"), leaf("{signal}", $aI, $aJ), $aI, $aJ, "src/page.vl:384:3"), pt(" hole sets the text node once, then sets it again whenever the signal changes. There is no virtual DOM, no render loop, and no dependency array to babysit. Updates land exactly where the data changed.", $aI, $aJ), $aI, $aJ, "src/page.vl:384:3"), $aI, $aJ, "src/page.vl:382:14"), child2(styled(view("p"), lead), "The snippet is the whole program, and it runs. Try it right here:", $aI, $aJ, "src/page.vl:389:3"), $aI, $aJ, "src/page.vl:382:14"), counter_demo($aI, $aJ), $aI, $aJ, "src/page.vl:382:14");
	return child(child(styled(view("section"), add(add(column, section_block), stack)), showcase(prose, reactive_snippet($aI, $aJ), $aI, $aJ), $aI, $aJ, "src/page.vl:392:2"), dataflow_art($aI, $aJ), $aI, $aJ, "src/page.vl:392:2");
}
function showcase_fullstack($cN, $cO) {
	return child(child(child(child(styled(view("section"), add(add(column, section_block), stack)), child2(styled(view("h2"), heading), "The server is a struct. The client is generated.", $cN, $cO, "src/page.vl:404:3"), $cN, $cO, "src/page.vl:403:2"), child(child(child(child(child(styled(view("p"), lead), pt("Mark a method ", $cN, $cO), $cN, $cO, "src/page.vl:405:3"), leaf_link("/docs/guide/services.html#what-rpc-calls-do", "[rpc]", $cN, $cO), $cN, $cO, "src/page.vl:405:3"), pt(" and the browser can call it like any other function, typed and checked. Mark a signal ", $cN, $cO), $cN, $cO, "src/page.vl:405:3"), leaf_link("/docs/guide/services.html#mirrors", "[expose]", $cN, $cO), $cN, $cO, "src/page.vl:405:3"), pt(" and every connected client holds a live mirror that updates when the server writes. You never write REST endpoints, fetch calls, or the JSON shapes that drift out of sync between them.", $cN, $cO), $cN, $cO, "src/page.vl:405:3"), $cN, $cO, "src/page.vl:403:2"), diagram($cN, $cO), $cN, $cO, "src/page.vl:403:2"), button_link("/docs/guide/services.html", "Services & RPC in the guide", $cN, $cO), $cN, $cO, "src/page.vl:403:2");
}
function diagnosed_snippet($cZ, $da) {
	return code_panel([ ln([ kw("fun", $cZ, $da), t(" ", $cZ, $da), fn("find_user", $cZ, $da), t("(id: i32): ", $cZ, $da), ty("Option", $cZ, $da), t("<str> {", $cZ, $da) ], $cZ, $da), ln([ t("    ", $cZ, $da), kw("if", $cZ, $da), t(" id == ", $cZ, $da), st("1", $cZ, $da), t(" { ", $cZ, $da), ty("Some", $cZ, $da), t("(", $cZ, $da), st("\"Ada\"", $cZ, $da), t(") } ", $cZ, $da), kw("else", $cZ, $da), t(" { ", $cZ, $da), ty("None", $cZ, $da), t(" }", $cZ, $da) ], $cZ, $da), ln([ t("}", $cZ, $da) ], $cZ, $da), ln([ kw("fun", $cZ, $da), t(" ", $cZ, $da), fn("greet", $cZ, $da), t("(name: str): str {", $cZ, $da) ], $cZ, $da), ln([ t("    ", $cZ, $da), st("i\"hello ", $cZ, $da), hl("{", $cZ, $da), t("name", $cZ, $da), hl("}", $cZ, $da), st("\"", $cZ, $da) ], $cZ, $da), ln([ t("}", $cZ, $da) ], $cZ, $da), ln([ kw("fun", $cZ, $da), t(" ", $cZ, $da), fn("main", $cZ, $da), t("() {", $cZ, $da) ], $cZ, $da), ln([ t("    ", $cZ, $da), fn("print", $cZ, $da), t("(", $cZ, $da), fn("greet", $cZ, $da), t("(", $cZ, $da), fn("find_user", $cZ, $da), t("(", $cZ, $da), st("2", $cZ, $da), t(")));", $cZ, $da) ], $cZ, $da), ln([ t("}", $cZ, $da) ], $cZ, $da) ], $cZ, $da);
}
function diagnostic_terminal($db, $dc) {
	return child(child(child(child(child(child(child(styled(view("pre"), diag_pre), ln([ child2(styled(view("span"), diag_error), "Error:", $db, $dc, "src/page.vl:491:4"), t(" Expected str, but got Option<str> instead.", $db, $dc) ], $db, $dc), $db, $dc, "src/page.vl:489:2"), ln([ child2(styled(view("span"), diag_frame), "   \u{256d}\u{2500}[ demo.vl:8:14 ]", $db, $dc, "src/page.vl:494:8") ], $db, $dc), $db, $dc, "src/page.vl:489:2"), ln([ child2(styled(view("span"), diag_frame), "   \u{2502}", $db, $dc, "src/page.vl:495:8") ], $db, $dc), $db, $dc, "src/page.vl:489:2"), ln([ child2(styled(view("span"), diag_frame), " 8 \u{2502}     print(greet(find_user(2)));", $db, $dc, "src/page.vl:496:8") ], $db, $dc), $db, $dc, "src/page.vl:489:2"), ln([ child2(styled(view("span"), diag_frame), "   \u{2502}                 \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{252c}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}", $db, $dc, "src/page.vl:497:8") ], $db, $dc), $db, $dc, "src/page.vl:489:2"), ln([ child2(styled(view("span"), diag_frame), "   \u{2502}                       \u{2570}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500} Expected str, but got Option<str> instead.", $db, $dc, "src/page.vl:499:4") ], $db, $dc), $db, $dc, "src/page.vl:489:2"), ln([ child2(styled(view("span"), diag_frame), "\u{2500}\u{2500}\u{2500}\u{256f}", $db, $dc, "src/page.vl:503:8") ], $db, $dc), $db, $dc, "src/page.vl:489:2");
}
function showcase_compiler($cX, $cY) {
	const code = child(child(styled(view("div"), diag_stack), diagnosed_snippet($cX, $cY), $cX, $cY, "src/page.vl:508:13"), diagnostic_terminal($cX, $cY), $cX, $cY, "src/page.vl:508:13");
	const prose = child(child(child(child(styled(view("div"), showcase_copy), child2(styled(view("h2"), heading), "Find out at compile time", $cX, $cY, "src/page.vl:513:3"), $cX, $cY, "src/page.vl:512:14"), child(child(child(child(child(styled(view("p"), lead), pt("Vilan has no null and no exceptions. A value that might be missing is an ", $cX, $cY), $cX, $cY, "src/page.vl:514:3"), leaf_link("/docs/std/option-result.html#optiont", "Option", $cX, $cY), $cX, $cY, "src/page.vl:514:3"), pt(", a call that might fail returns a ", $cX, $cY), $cX, $cY, "src/page.vl:514:3"), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $cX, $cY), $cX, $cY, "src/page.vl:514:3"), pt(", and the compiler makes you look inside before you use either. The mistake in this snippet is a build error, not a production incident.", $cX, $cY), $cX, $cY, "src/page.vl:514:3"), $cX, $cY, "src/page.vl:512:14"), child2(styled(view("p"), lead), "Values are copied rather than silently shared, so two names never fight over one object. Most of the mistakes JavaScript saves for runtime cannot even be written.", $cX, $cY, "src/page.vl:521:3"), $cX, $cY, "src/page.vl:512:14"), button_link("/docs/std/option-result.html", "Option & Result in the reference", $cX, $cY), $cX, $cY, "src/page.vl:512:14");
	return child(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped(code, prose, $cX, $cY), $cX, $cY, "src/page.vl:526:2");
}
function editor_band($df, $dg) {
	const prose = child(child(child(child(styled(view("div"), showcase_copy), child2(styled(view("h2"), heading), "The editor is in on it", $df, $dg, "src/page.vl:533:3"), $df, $dg, "src/page.vl:532:14"), child(child(child(child(styled(view("p"), lead), leaf("vilan", $df, $dg), $df, $dg, "src/page.vl:534:3"), pt(" and ", $df, $dg), $df, $dg, "src/page.vl:534:3"), leaf("vilan-lsp", $df, $dg), $df, $dg, "src/page.vl:534:3"), pt(" ship together so your editor and build never disagree. In-editor diagnostics, hover types and docs, autocompletion, Symbol Rename, formatting, and Organize Imports are all available in VS Code today.", $df, $dg), $df, $dg, "src/page.vl:534:3"), $df, $dg, "src/page.vl:532:14"), child2(styled(view("p"), lead), "One broken line does not take the tooling down. The rest of the file keeps compiling, serving hovers, and completing while you fix it.", $df, $dg, "src/page.vl:540:3"), $df, $dg, "src/page.vl:532:14"), button_link("https://github.com/vilan-lang/vilan/tree/main/editors/vscode", "The VS Code extension", $df, $dg), $df, $dg, "src/page.vl:532:14");
	return child(styled(view("section"), add(add(column, section_block), stack)), showcase_flipped(editor_art($df, $dg), prose, $df, $dg), $df, $dg, "src/page.vl:548:2");
}
function button_link(href, label, $cV, $cW) {
	return child(child(attr(styled(view("a"), button_link_style), "href", href, $cV, $cW, "src/page.vl:633:2"), pt(label, $cV, $cW), $cV, $cW, "src/page.vl:633:2"), attr(attr(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $cV, $cW, "src/page.vl:635:3"), "alt", "", $cV, $cW, "src/page.vl:635:3"), $cV, $cW, "src/page.vl:633:2");
}
function docs_link(href, label, $dn, $do) {
	return child(child(attr(styled(view("a"), card_link), "href", href, $dn, $do, "src/page.vl:640:2"), pt(label, $dn, $do), $dn, $do, "src/page.vl:640:2"), attr(attr(styled(view("img"), link_arrow), "src", "" + assets + "/icons/move-right.svg", $dn, $do, "src/page.vl:642:3"), "alt", "", $dn, $do, "src/page.vl:642:3"), $dn, $do, "src/page.vl:640:2");
}
function feature(icon, name, href, body, $dl, $dm) {
	return child(child(child(child(styled(view("article"), card), attr(attr(styled(view("img"), card_icon), "src", "" + assets + "/icons/" + icon + ".svg", $dl, $dm, "src/page.vl:654:3"), "alt", "", $dl, $dm, "src/page.vl:654:3"), $dl, $dm, "src/page.vl:653:2"), child2(styled(view("h3"), card_title), name, $dl, $dm, "src/page.vl:655:3"), $dl, $dm, "src/page.vl:653:2"), child4(styled(view("p"), card_body), __clone(body), $dl, $dm, "src/page.vl:656:3"), $dl, $dm, "src/page.vl:653:2"), docs_link(href, "docs", $dl, $dm), $dl, $dm, "src/page.vl:653:2");
}
function feature_grid($dj, $dk) {
	return child(child(styled(view("section"), add(add(column, section_block), stack)), child2(styled(view("h2"), heading), "Built into the language", $dj, $dk, "src/page.vl:663:3"), $dj, $dk, "src/page.vl:662:2"), child(child(child(child(child(child(attr(styled(view("div"), cards_grid), "data-glow", "", $dj, $dk, "src/page.vl:664:3"), feature("shield-check", "No null, no exceptions", "/docs/std/option-result.html", [ pt("A missing value is an ", $dj, $dk), leaf_link("/docs/std/option-result.html#optiont", "Option", $dj, $dk), pt(", a failure is a ", $dj, $dk), leaf_link("/docs/std/option-result.html#resultt-e", "Result", $dj, $dk), pt(", and ", $dj, $dk), leaf("match", $dj, $dk), pt(" makes you handle both arms. Errors are ordinary values you pass around like any other data.", $dj, $dk) ], $dj, $dk), $dj, $dk, "src/page.vl:664:3"), feature("copy", "Values, not references", "/docs/tour/memory-model.html", [ pt("Assignment copies. Sharing is explicit, borrowing is checked, and spooky action at a distance is a compile error.", $dj, $dk) ], $dj, $dk), $dj, $dk, "src/page.vl:664:3"), feature("zap", "Async without the ceremony", "/docs/tour/async.html", [ leaf_link("/docs/tour/async.html#opting-out-of-waiting-async-and-await", "await", $dj, $dk), pt(" is implicit. Call an async function and the machinery is the compiler\'s problem. When you want real concurrency, tasks and ", $dj, $dk), leaf_link("/docs/tour/async.html#nurseries-structured-spawning", "nurseries", $dj, $dk), pt(" give it structure.", $dj, $dk) ], $dj, $dk), $dj, $dk, "src/page.vl:664:3"), feature("layers", "One program, two platforms", "/docs/tour/platforms.html", [ pt("One workspace compiles the node server and the browser client. The compiler tracks which code needs which platform and keeps each bundle honest.", $dj, $dk) ], $dj, $dk), $dj, $dk, "src/page.vl:664:3"), feature("server", "Rendered before it ships", "/docs/guide/ssr.html", [ leaf("std::web::ui", $dj, $dk), pt(" renders on the server too: first paint is real markup, then the client rebuilds it live. View source on this page and the content is already there.", $dj, $dk) ], $dj, $dk), $dj, $dk, "src/page.vl:664:3"), feature("refresh-cw", "A dev loop that keeps up", "/docs/guide/dev-loop.html", [ leaf("vilan run . --watch", $dj, $dk), pt(" rebuilds in milliseconds and hot-reloads the browser. Format, test, and language server ship in the same binary.", $dj, $dk) ], $dj, $dk), $dj, $dk, "src/page.vl:664:3"), $dj, $dk, "src/page.vl:662:2");
}
function dogfood($dp, $dq) {
	return child(child(child(styled(view("section"), add(add(column, section_block), stack)), child2(styled(view("p"), dogfood_text), "This site is a vilan program: one package, three entries \u{2014} this page, the playground, and the server that renders both. The server rendered the markup you first saw, and the browser rebuilt it live.", $dp, $dq, "src/page.vl:711:3"), $dp, $dq, "src/page.vl:710:2"), child2(styled(view("p"), dogfood_text), "Vilan is built to last. Semantics are settled on paper before they are implemented, and pinned by tests after. A language is a foundation, and a foundation should not move under you.", $dp, $dq, "src/page.vl:714:3"), $dp, $dq, "src/page.vl:710:2"), child(styled(view("p"), dogfood_cta), docs_link("https://github.com/vilan-lang/website", "Read this page\'s source", $dp, $dq), $dp, $dq, "src/page.vl:717:3"), $dp, $dq, "src/page.vl:710:2");
}
function footer_column(title, links, $dt, $du) {
	return child(child(view("div"), child2(styled(view("p"), footer_head), title, $dt, $du, "src/page.vl:764:3"), $dt, $du, "src/page.vl:763:2"), child4(styled(view("div"), footer_list), __clone(links), $dt, $du, "src/page.vl:765:3"), $dt, $du, "src/page.vl:763:2");
}
function page_footer($dr, $ds) {
	return child(child(styled(view("footer"), footer_block), child(child(child(child(styled(view("div"), add(column, footer_grid)), styled(attr(attr(attr(view("img"), "src", "" + assets + "/footer_mark.webp", $dr, $ds, "src/page.vl:772:4"), "alt", "The vilan mark", $dr, $ds, "src/page.vl:772:4"), "width", "200", $dr, $ds, "src/page.vl:772:4"), footer_mark), $dr, $ds, "src/page.vl:771:3"), footer_column("Using Vilan", [ child2(attr(styled(view("a"), footer_link), "href", "#install", $dr, $ds, "src/page.vl:779:5"), "Install", $dr, $ds, "src/page.vl:779:5"), child2(attr(styled(view("a"), footer_link), "href", "/docs/tour/hello-vilan.html", $dr, $ds, "src/page.vl:780:5"), "Learn", $dr, $ds, "src/page.vl:780:5"), child2(attr(styled(view("a"), footer_link), "href", "/playground", $dr, $ds, "src/page.vl:781:5"), "Playground", $dr, $ds, "src/page.vl:781:5"), child2(attr(styled(view("a"), footer_link), "href", "/docs/", $dr, $ds, "src/page.vl:782:5"), "Documentation", $dr, $ds, "src/page.vl:782:5") ], $dr, $ds), $dr, $ds, "src/page.vl:771:3"), footer_column("Community", [ child2(attr(styled(view("a"), footer_link), "href", "" + repo + "/issues", $dr, $ds, "src/page.vl:785:5"), "Issues", $dr, $ds, "src/page.vl:785:5"), child2(attr(styled(view("a"), footer_link), "href", "" + repo + "/discussions", $dr, $ds, "src/page.vl:786:5"), "Discussions", $dr, $ds, "src/page.vl:786:5"), child2(attr(styled(view("a"), footer_link), "href", "https://github.com/vilan-lang", $dr, $ds, "src/page.vl:787:5"), "GitHub", $dr, $ds, "src/page.vl:787:5") ], $dr, $ds), $dr, $ds, "src/page.vl:771:3"), footer_column("Terms & policies", [ child2(attr(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/CODE_OF_CONDUCT.md", $dr, $ds, "src/page.vl:790:5"), "Code of Conduct", $dr, $ds, "src/page.vl:790:5"), child2(attr(styled(view("a"), footer_link), "href", "" + repo + "#license", $dr, $ds, "src/page.vl:793:5"), "Licenses", $dr, $ds, "src/page.vl:793:5"), child2(attr(styled(view("a"), footer_link), "href", "" + repo + "/blob/main/assets/branding/LICENSE", $dr, $ds, "src/page.vl:794:5"), "Logo Policy", $dr, $ds, "src/page.vl:794:5") ], $dr, $ds), $dr, $ds, "src/page.vl:771:3"), $dr, $ds, "src/page.vl:770:2"), child(styled(view("div"), column), child(child(styled(view("div"), footer_micro), child2(view("span"), "\u{a9} 2026 Reed Syllas", $dr, $ds, "src/page.vl:801:5"), $dr, $ds, "src/page.vl:800:4"), child2(view("span"), "MIT or Apache-2.0", $dr, $ds, "src/page.vl:802:5"), $dr, $ds, "src/page.vl:800:4"), $dr, $ds, "src/page.vl:799:3"), $dr, $ds, "src/page.vl:770:2");
}
function divider($S, $T) {
	return child(styled(view("div"), column), styled(view("div"), rule_line), $S, $T, "src/theme.vl:467:2");
}
function grain() {
	return styled(view("div"), grain_overlay);
}
function top_bar(scroll_fade2, $m, $n) {
	return child(style_var(styled(view("nav"), topbar), "--nav-fade", __clone(scroll_fade2), $m, $n, "src/topbar.vl:98:24"), child(child(styled(view("div"), add(column, nav_row)), child(child(attr(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $m, $n, "src/topbar.vl:100:4"), attr(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $m, $n, "src/topbar.vl:101:5"), $m, $n, "src/topbar.vl:100:4"), child2(view("span"), "VILAN", $m, $n, "src/topbar.vl:102:5"), $m, $n, "src/topbar.vl:100:4"), $m, $n, "src/topbar.vl:99:3"), child(child(child(child(styled(view("div"), nav_links), child2(attr(styled(view("a"), nav_link), "href", "/#install", $m, $n, "src/topbar.vl:105:5"), "Install", $m, $n, "src/topbar.vl:105:5"), $m, $n, "src/topbar.vl:104:4"), child2(attr(styled(view("a"), nav_link), "href", "/docs/tour/hello-vilan.html", $m, $n, "src/topbar.vl:106:5"), "Learn", $m, $n, "src/topbar.vl:106:5"), $m, $n, "src/topbar.vl:104:4"), child2(attr(styled(view("a"), nav_link), "href", "/playground/", $m, $n, "src/topbar.vl:107:5"), "Playground", $m, $n, "src/topbar.vl:107:5"), $m, $n, "src/topbar.vl:104:4"), child2(attr(styled(view("a"), nav_link), "href", "/docs/", $m, $n, "src/topbar.vl:108:5"), "Docs", $m, $n, "src/topbar.vl:108:5"), $m, $n, "src/topbar.vl:104:4"), $m, $n, "src/topbar.vl:99:3"), $m, $n, "src/topbar.vl:98:2");
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
function values(self) {
	return __nmap_values(self[0]);
}
function child(self, content, $k, $l, caller) {
	place(content, self, $k, $l, caller);
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
function sub(self, observer, caller) {
	return place_subscription(attach_observer(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true), caller);
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
function follow(flow, observer, $r, $s, caller) {
	take(get_owner($s), sub(flow, observer, caller), $r);
}
function style_var(self, name, source, $o, $p, caller) {
	const element = __clone(self[0]);
	follow(source, (value, $q) => {
		element.style.setProperty(name, value);
		return;
	}, $o, $p, caller);
	return __clone(self);
}
function keys(self) {
	return __nmap_keys(self[0]);
}
function get2(self, key) {
	return __nmap_get(self[0], hash(key));
}
function remove(self, key) {
	__nmap_remove(self[0], hash(key));
}
function insert(self, key, value) {
	__nmap_insert(self[0], hash(key), __clone(key), __clone(value));
}
function attr(self, name, value, $M, $N, caller) {
	apply(value, self, name, $M, $N, caller);
	return __clone(self);
}
function child2(self, content, $k, $l, caller) {
	place2(content, self, $k, $l, caller);
	return __clone(self);
}
function notify(self, $ah) {
	const traced = tracing.v;
	let $ai = null;
	if (traced) {
		$ai = trace_hooks.v[2](__shared_identity(self[0]));
	} else {
		$ai = "";
	}
	const cause = $ai;
	const $aj = $ah;
	let $ak = null;
	if ($aj[0] === 0) {
		const turn2 = $aj[1];
		$ak = queue_wakes(turn2, __clone(self[1].v), traced, cause);
	} else {
		const $am = last(draining_turns.v);
		let $an = null;
		if ($am[0] === 0) {
			const draining = $am[1];
			$an = queue_wakes(draining, __clone(self[1].v), traced, cause);
		} else {
			for (const subscriber of __clone(self[1].v)) {
				let $ao = null;
				if (subscriber[2].v) {
					if (traced) {
						trace_hooks.v[5](subscriber, cause);
					} else {
						subscriber[1]();
					}
					$ao = undefined;
				}
				$ao;
			}
			$an = undefined;
		}
		$ak = $an;
	}
	return $ak;
}
function set(self, value, $ag, caller) {
	if (tracing.v) {
		trace_hooks.v[1](caller);
	}
	self[0].v = __clone(value);
	notify(self, $ag);
}
function turn(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[5].v = true;
	return result;
}
function bind_text_attribute_flow(flow, parent, name, $aB, $aC, caller) {
	const element = __clone(parent[0]);
	follow(flow, (value, $aD) => {
		element.setAttribute(name, value);
		return;
	}, $aB, $aC, caller);
}
function bind_attribute(self, parent, name, $az, $aA, caller) {
	bind_text_attribute_flow(self, parent, name, $az, $aA, caller);
}
function bind_attr(self, name, source, $ax, $ay, caller) {
	bind_attribute(source, self, name, $ax, $ay, caller);
	return __clone(self);
}
function new6(value, caller) {
	return new4(value, caller);
}
function set2(self, value, $ag, caller) {
	if (tracing.v) {
		trace_hooks.v[1](caller);
	}
	self[0].v = __clone(value);
	notify(self, $ag);
}
function set3(self, value, $aP, caller) {
	set2(self, value, $aP, caller);
}
function set_with(self, transform, $aO) {
	set3(self, transform(get(self)), $aO, "std/src/reactive.vl:2546:8");
}
function derive(self, transform, caller) {
	return [ self, transform, caller ];
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
	const $bu = self;
	return $bu[0] === 1;
}
function run_body(runs, body) {
	const run = renew(runs);
	const $bD = nursery(run);
	let $bE = null;
	if ($bD[0] === 0) {
		const nursery2 = $bD[1];
		$bE = (($bF) => {
			return (($bG) => {
				return body($bF, $bG);
			})(nursery2);
		})(run);
	} else {
		$bE = (() => {
			throw __panic("a renewed run carries its nursery", "std/src/reactive.vl:1405:11");
		})();
	}
	return $bE;
}
function last2(self) {
	let $bX = null;
	if (is_empty(self)) {
		$bX = [ 1 ];
	} else {
		$bX = __list_get(self, self.length - 1);
	}
	return $bX;
}
function run_once(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = run_body(runs, ($bm, $bn) => {
		return (($bo) => {
			return body($bm, $bo, $bn);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function run_tracked(runs, tracker, body) {
	let value = run_once(runs, tracker, ($bh, $bi, $bj) => {
		return body($bh, $bi, $bj);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = run_once(runs, tracker, ($ca, $cb, $cc) => {
			return body($ca, $cb, $cc);
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
	const site = __clone(self[2]);
	const upstream = start(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker([ 0, site ]);
	return [ () => {
		const value = pull();
		return run_tracked(runs, tracker, ($be, $bf, $bg) => {
			return transform(value, $be, $bf, $bg);
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
function sub2(self, observer, caller) {
	return observe_flow(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true, caller);
}
function follow2(flow, observer, $r, $s, caller) {
	take(get_owner($s), sub2(flow, observer, caller), $r);
}
function place_text_flow(flow, parent, $bb, $bc, caller) {
	const node = document.createTextNode("");
	parent[0].appendChild(node);
	defer(get_owner($bc), () => {
		if (!(is_leaving(node))) {
			node.remove();
		}
		return;
	});
	follow2(flow, (value, $bd) => {
		node.textContent = value;
		return;
	}, $bb, $bc, caller);
}
function place4(self, parent, $aZ, $ba, caller) {
	place_text_flow(self, parent, $aZ, $ba, caller);
}
function child3(self, content, $k, $l, caller) {
	place4(content, self, $k, $l, caller);
	return __clone(self);
}
function child4(self, content, $k, $l, caller) {
	place3(content, self, $k, $l, caller);
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
const leaving_runs = __shared_new([  ]);
const art_stage = [ [ [ new Map([ [ "::overflow", [ "::overflow", [ 0, [ "syp1ckj", "overflow:hidden" ] ] ] ], [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ] ], [ "::--art-shadow", [ "::--art-shadow", [ 0, [ "s18vcma9", "--art-shadow:var(--shadow)" ] ] ] ], [ "::--reveal", [ "::--reveal", [ 0, [ "s1wraoya", "--reveal:1" ] ] ] ] ]), undefined ] ] ];
const art_card = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxq6", "padding-top:var(--space-4)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "sh1avk2", "border-radius:14px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ] ], [ "::box-shadow", [ "::box-shadow", [ 0, [ "szsnppy", "box-shadow:0 8px 40px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ] ] ]), undefined ] ] ];
const art_tab = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk15j", "font-size:11px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "s1ny1qxg", "letter-spacing:0.1em" ] ] ] ], [ "::text-transform", [ "::text-transform", [ 0, [ "s1s2tj83", "text-transform:uppercase" ] ] ] ], [ "::margin-top", [ "::margin-top", [ 0, [ "snx6qru", "margin-top:var(--space-2)" ] ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ 0, [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s30a1l5", "opacity:0.55" ] ] ] ] ]), undefined ] ] ];
const art_code = [ [ [ new Map([ [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "s24ary3", "font-size:12.5px" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "s9bu6v5", "line-height:1.7" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1hzt6rq", "color:rgb(from var(--up-bright) r g b / 0.92)" ] ] ] ], [ "::white-space", [ "::white-space", [ 0, [ "s1oc7mru", "white-space:pre" ] ] ] ] ]), undefined ] ] ];
const art_caption = [ [ [ new Map([ [ "::margin-top", [ "::margin-top", [ 0, [ "snx6qto", "margin-top:var(--space-4)" ] ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ 0, [ "s1c0tki8", "margin-bottom:var(--space-4)" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk1zs", "font-size:12px" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "s1odiaav", "letter-spacing:0.04em" ] ] ] ], [ "::text-align", [ "::text-align", [ 0, [ "s17ya8sq", "text-align:center" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s30a1l5", "opacity:0.55" ] ] ] ] ]), undefined ] ] ];
const dot_magenta = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "sgdl7ao", "width:9px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxwfsy", "height:9px" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1i756l7", "background-color:#8B2786" ] ] ] ] ]), undefined ] ] ];
const dot_orange = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "sgdl7ao", "width:9px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxwfsy", "height:9px" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s19dy6kf", "background-color:var(--primary)" ] ] ] ] ]), undefined ] ] ];
const arrow_head_left = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "sgdl6gf", "width:8px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxweyp", "height:8px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s19dy6kf", "background-color:var(--primary)" ] ] ] ], [ "::clip-path", [ "::clip-path", [ 0, [ "s13bfwa8", "clip-path:polygon(100% 0, 0 50%, 100% 100%)" ] ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ 0, [ "s1lr51x", "flex-shrink:0" ] ] ] ] ]), undefined ] ] ];
const arrow_head_right_rose = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "sgdl6gf", "width:8px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxweyp", "height:8px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "sumjtxl", "background-color:var(--accent)" ] ] ] ], [ "::clip-path", [ "::clip-path", [ 0, [ "sdy8hnu", "clip-path:polygon(0 0, 100% 50%, 0 100%)" ] ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ 0, [ "s1lr51x", "flex-shrink:0" ] ] ] ] ]), undefined ] ] ];
const arrow_head_right = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "sgdl6gf", "width:8px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxweyp", "height:8px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s19dy6kf", "background-color:var(--primary)" ] ] ] ], [ "::clip-path", [ "::clip-path", [ 0, [ "sdy8hnu", "clip-path:polygon(0 0, 100% 50%, 0 100%)" ] ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ 0, [ "s1lr51x", "flex-shrink:0" ] ] ] ] ]), undefined ] ] ];
const dg_blob_top = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sc4alkf", "filter:blur(60px)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvs7h", "left:30%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s8i24vg", "top:-14%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl1ga", "width:42%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxwavk", "height:55%" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "szxtch6", "background-image:radial-gradient(closest-side, rgba(178, 48, 86, 0.5) 0%, transparent 100%)" ] ] ] ] ]), undefined ] ] ];
const dg_blob_left = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sc4alkf", "filter:blur(60px)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvndb", "left:-8%" ] ] ] ], [ "::bottom", [ "::bottom", [ 0, [ "s11gfv4k", "bottom:-18%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl0pp", "width:36%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxwast", "height:52%" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "shcp77k", "background-image:radial-gradient(closest-side, rgba(103, 34, 131, 0.5) 0%, transparent 100%)" ] ] ] ] ]), undefined ] ] ];
const dg_blob_right = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sc4alkf", "filter:blur(60px)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::right", [ "::right", [ 0, [ "svx3j4l", "right:-8%" ] ] ] ], [ "::bottom", [ "::bottom", [ 0, [ "s11gfv0w", "bottom:-14%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl0rj", "width:38%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxwast", "height:52%" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "s5lsrvs", "background-image:radial-gradient(closest-side, rgba(235, 104, 46, 0.4) 0%, transparent 100%)" ] ] ] ] ]), undefined ] ] ];
const dg_source = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxq6", "padding-top:var(--space-4)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "sh1avk2", "border-radius:14px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ] ], [ "::box-shadow", [ "::box-shadow", [ 0, [ "szsnppy", "box-shadow:0 8px 40px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ] ], [ "::margin-left", [ "::margin-left", [ 0, [ "s10oplpw", "margin-left:auto" ] ] ] ], [ "::margin-right", [ "::margin-right", [ 0, [ "sp4tc1m", "margin-right:auto" ] ] ] ], [ "::max-width", [ "::max-width", [ 0, [ "s1puqmpj", "max-width:460px" ] ] ] ] ]), undefined ] ] ];
const dg_wire_zone = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s2310lv", "height:64px" ] ] ] ], [ "::display", [ "::display", [ 0, [ "sbiv4i3", "display:none" ] ] ] ], [ "1024px::display", [ "1024px::display", [ 0, [ "s1pon8d1", "display:block" ] ] ] ] ]), undefined ] ] ];
const dg_wire_left = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxw9x7", "height:2px" ] ] ] ], [ "::transform-origin", [ "::transform-origin", [ 0, [ "soitk1p", "transform-origin:left center" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvtvz", "left:50%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s9a6ol", "top:8px" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s64rvxm", "width:210px" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "sfb7qpy", "background-image:linear-gradient(270deg, #B23056 0%, #672283 100%)" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "sxyfb32", "transform:translateX(-40px) rotate(160deg)" ] ] ] ] ]), undefined ] ] ];
const dg_wire_right = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxw9x7", "height:2px" ] ] ] ], [ "::transform-origin", [ "::transform-origin", [ 0, [ "soitk1p", "transform-origin:left center" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvtvz", "left:50%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s9a6ol", "top:8px" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s64rvxm", "width:210px" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "s10fot13", "background-image:linear-gradient(90deg, #D84730 0%, var(--primary) 100%)" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "sllsl8", "transform:translateX(40px) rotate(20deg)" ] ] ] ] ]), undefined ] ] ];
const dg_wire_label_left = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s8i65b9", "top:26px" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "s23lcvu", "font-size:11.5px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s9d85rj", "color:var(--accent)" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvrgw", "left:24%" ] ] ] ] ]), undefined ] ] ];
const dg_wire_label_right = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s8i65b9", "top:26px" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "s23lcvu", "font-size:11.5px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s9d85rj", "color:var(--accent)" ] ] ] ], [ "::right", [ "::right", [ 0, [ "svx3n86", "right:24%" ] ] ] ] ]), undefined ] ] ];
const dg_legs = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbipssh", "display:grid" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyte", "gap:var(--space-6)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s13ace9s", "align-items:stretch" ] ] ] ], [ "::margin-top", [ "::margin-top", [ 0, [ "snx6qto", "margin-top:var(--space-4)" ] ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ 0, [ "s1c0tki8", "margin-bottom:var(--space-4)" ] ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ 0, [ "s1tdau93", "grid-template-columns:1fr 230px 1fr" ] ] ] ] ]), undefined ] ] ];
const dg_leg_head = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myypq", "gap:var(--space-2)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::margin-top", [ "::margin-top", [ 0, [ "snx6qru", "margin-top:var(--space-2)" ] ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ 0, [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ] ] ]), undefined ] ] ];
const dg_leg_name = [ [ [ new Map([ [ "::font-family", [ "::font-family", [ 0, [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk4ij", "font-size:15px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ] ]), undefined ] ] ];
const dg_leg_env = [ [ [ new Map([ [ "::margin-left", [ "::margin-left", [ 0, [ "s10oplpw", "margin-left:auto" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk15j", "font-size:11px" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s3a4es", "opacity:0.5" ] ] ] ] ]), undefined ] ] ];
const dg_mid = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiv4i3", "display:none" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyrk", "gap:var(--space-4)" ] ] ] ], [ "::justify-content", [ "::justify-content", [ 0, [ "s1d7ek7w", "justify-content:center" ] ] ] ], [ "1024px::display", [ "1024px::display", [ 0, [ "s10b6u2h", "display:flex" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ] ]), undefined ] ] ];
const dg_mid_label = [ [ [ new Map([ [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "s23lcvu", "font-size:11.5px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::text-align", [ "::text-align", [ 0, [ "s17ya8sq", "text-align:center" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1i5dkrp", "color:var(--primary)" ] ] ] ] ]), undefined ] ] ];
const dg_mid_label_rose = [ [ [ new Map([ [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "s23lcvu", "font-size:11.5px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::text-align", [ "::text-align", [ 0, [ "s17ya8sq", "text-align:center" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s9d85rj", "color:var(--accent)" ] ] ] ] ]), undefined ] ] ];
const dg_line_row = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ] ]), undefined ] ] ];
const dg_line = [ [ [ new Map([ [ "::flex", [ "::flex", [ 0, [ "skj5p4u", "flex:1" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxw9x7", "height:2px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s19dy6kf", "background-color:var(--primary)" ] ] ] ] ]), undefined ] ] ];
const dg_line_dashed = [ [ [ new Map([ [ "::flex", [ "::flex", [ 0, [ "skj5p4u", "flex:1" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxw9x7", "height:2px" ] ] ] ], [ "::background", [ "::background", [ 0, [ "sc7epnf", "background:repeating-linear-gradient(90deg, var(--accent) 0 5px, transparent 5px 11px)" ] ] ] ], [ "::animation", [ "::animation", [ 0, [ "s1dyc7rh", "animation:dash-flow 1.6s linear infinite" ] ] ] ] ]), undefined ] ] ];
const dg_note = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk15j", "font-size:11px" ] ] ] ], [ "::text-align", [ "::text-align", [ 0, [ "s17ya8sq", "text-align:center" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s3a4et", "opacity:0.6" ] ] ] ] ]), undefined ] ] ];
const ed_blob_a = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sc4alkf", "filter:blur(60px)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvqiz", "left:10%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s8i25m1", "top:-20%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl34s", "width:62%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxwbn2", "height:62%" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "swx3oin", "background-image:radial-gradient(closest-side, rgba(178, 48, 86, 0.55) 0%, transparent 100%)" ] ] ] ] ]), undefined ] ] ];
const ed_blob_b = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sc4alkf", "filter:blur(60px)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::right", [ "::right", [ 0, [ "s1mwnm2q", "right:-14%" ] ] ] ], [ "::bottom", [ "::bottom", [ 0, [ "s11gfvrh", "bottom:-20%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl1ls", "width:48%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxwatq", "height:53%" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "s1dm9aos", "background-image:radial-gradient(closest-side, rgba(235, 104, 46, 0.35) 0%, transparent 100%)" ] ] ] ] ]), undefined ] ] ];
const ed_window = [ [ [ new Map([ [ "::overflow", [ "::overflow", [ 0, [ "syp1ckj", "overflow:hidden" ] ] ] ], [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::margin-top", [ "::margin-top", [ 0, [ "snx6qvi", "margin-top:var(--space-6)" ] ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ 0, [ "s1c0tkk2", "margin-bottom:var(--space-6)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "sh1atvk", "border-radius:12px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s1m3negi", "border:1px solid rgb(from var(--up-bright) r g b / 0.14)" ] ] ] ], [ "::box-shadow", [ "::box-shadow", [ 0, [ "s1qfnv05", "box-shadow:0 24px 80px rgb(from var(--art-shadow) r g b / calc(alpha * 0.6))" ] ] ] ] ]), undefined ] ] ];
const ed_titlebar = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myypq", "gap:var(--space-2)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxp9", "padding-top:var(--space-3)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiykh", "padding-bottom:var(--space-3)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "sxiw6xl", "background-color:rgb(from var(--up-bright) r g b / 0.04)" ] ] ] ], [ "::border-bottom", [ "::border-bottom", [ 0, [ "spji67t", "border-bottom:1px solid rgb(from var(--up-bright) r g b / 0.08)" ] ] ] ] ]), undefined ] ] ];
const ed_dot_red = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "s178fo2h", "width:11px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x3fv", "height:11px" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s30a1nw", "opacity:0.85" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1prq81g", "background-color:#D84730" ] ] ] ] ]), undefined ] ] ];
const ed_dot_orange = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "s178fo2h", "width:11px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x3fv", "height:11px" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s30a1nw", "opacity:0.85" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s19dy6kf", "background-color:var(--primary)" ] ] ] ] ]), undefined ] ] ];
const ed_dot_magenta = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "s178fo2h", "width:11px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x3fv", "height:11px" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s30a1nw", "opacity:0.85" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1i756l7", "background-color:#8B2786" ] ] ] ] ]), undefined ] ] ];
const ed_title = [ [ [ new Map([ [ "::margin-left", [ "::margin-left", [ 0, [ "s10oplpw", "margin-left:auto" ] ] ] ], [ "::margin-right", [ "::margin-right", [ 0, [ "sp4tc1m", "margin-right:auto" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk1zs", "font-size:12px" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s30a1l5", "opacity:0.55" ] ] ] ] ]), undefined ] ] ];
const ed_body = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxq6", "padding-top:var(--space-4)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq90yh", "line-height:24px" ] ] ] ] ]), undefined ] ] ];
const ed_gutter = [ [ [ new Map([ [ "::padding-right", [ "::padding-right", [ 0, [ "s16t31ia", "padding-right:16px" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s178i1rz", "width:44px" ] ] ] ], [ "::text-align", [ "::text-align", [ 0, [ "s1czd0mf", "text-align:right" ] ] ] ], [ "::white-space", [ "::white-space", [ 0, [ "s1oc7mru", "white-space:pre" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s30a1ih", "opacity:0.28" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ] ]), undefined ] ] ];
const ed_code = [ [ [ new Map([ [ "::overflow", [ "::overflow", [ 0, [ "s19aluk0", "overflow:auto" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1hzt6rq", "color:rgb(from var(--up-bright) r g b / 0.92)" ] ] ] ], [ "::white-space", [ "::white-space", [ 0, [ "s1oc7mru", "white-space:pre" ] ] ] ] ]), undefined ] ] ];
const ed_squiggle = [ [ [ new Map([ [ "::text-decoration", [ "::text-decoration", [ 0, [ "s16zcev2", "text-decoration:underline wavy var(--art-error) 1.5px" ] ] ] ], [ "::text-underline-offset", [ "::text-underline-offset", [ 0, [ "s1jf3sec", "text-underline-offset:5px" ] ] ] ] ]), undefined ] ] ];
const ed_caret = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sfatq7m", "display:inline-block" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl1ex", "width:2px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x6sv", "height:15px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "syz58y5", "background-color:var(--up-bright)" ] ] ] ], [ "::vertical-align", [ "::vertical-align", [ 0, [ "s18wji4a", "vertical-align:text-bottom" ] ] ] ], [ "::margin-left", [ "::margin-left", [ 0, [ "szjsw2c", "margin-left:1px" ] ] ] ], [ "::animation", [ "::animation", [ 0, [ "s1fjlvgr", "animation:caret-blink 1.1s step-start infinite" ] ] ] ] ]), undefined ] ] ];
const ed_hover = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::left", [ "::left", [ 0, [ "s1ypvw5g", "left:clamp(120px, 30%, 185px)" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s1vku06o", "top:300px" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxp9", "padding-top:var(--space-3)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiykh", "padding-bottom:var(--space-3)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s1o8o1ug", "width:min(400px, 70%)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "sh1as72", "border-radius:10px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s1m3nek6", "border:1px solid rgb(from var(--up-bright) r g b / 0.18)" ] ] ] ], [ "::box-shadow", [ "::box-shadow", [ 0, [ "s3qy95a", "box-shadow:0 16px 48px rgb(from var(--art-shadow) r g b / calc(alpha * 0.55))" ] ] ] ], [ "::z-index", [ "::z-index", [ 0, [ "sehvv7j", "z-index:2" ] ] ] ] ]), undefined ] ] ];
const ed_hover_error = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "s24ary3", "font-size:12.5px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "s9bu6v4", "line-height:1.6" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1r7vnvj", "color:var(--art-error)" ] ] ] ] ]), undefined ] ] ];
const ed_hover_from = [ [ [ new Map([ [ "::margin-top", [ "::margin-top", [ 0, [ "snx6qru", "margin-top:var(--space-2)" ] ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ 0, [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk15j", "font-size:11px" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s30a1k8", "opacity:0.45" ] ] ] ] ]), undefined ] ] ];
const ed_statusbar = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyrk", "gap:var(--space-4)" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxoc", "padding-top:var(--space-2)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk15j", "font-size:11px" ] ] ] ], [ "::border-top", [ "::border-top", [ 0, [ "sxf8ud1", "border-top:1px solid rgb(from var(--up-bright) r g b / 0.08)" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s30a1l5", "opacity:0.55" ] ] ] ] ]), undefined ] ] ];
const ed_problem = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "s1r7vnvj", "color:var(--art-error)" ] ] ] ] ]), undefined ] ] ];
const ed_status_right = [ [ [ new Map([ [ "::margin-left", [ "::margin-left", [ 0, [ "s10oplpw", "margin-left:auto" ] ] ] ] ]), undefined ] ] ];
const tc_wrap = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::margin-left", [ "::margin-left", [ 0, [ "s10oplpw", "margin-left:auto" ] ] ] ], [ "::margin-right", [ "::margin-right", [ 0, [ "sp4tc1m", "margin-right:auto" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s667hsd", "width:420px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wqggao", "height:430px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ] ], [ "::--art-shadow", [ "::--art-shadow", [ 0, [ "s18vcma9", "--art-shadow:var(--shadow)" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ] ]), undefined ] ] ];
const tc_blob_a = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sc4alkf", "filter:blur(60px)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvqqb", "left:18%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s99zzy", "top:22%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl36m", "width:64%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxwayb", "height:58%" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "smbhl57", "background-image:radial-gradient(closest-side, rgba(178, 48, 86, 0.6) 0%, transparent 100%)" ] ] ] ] ]), undefined ] ] ];
const tc_blob_b = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sc4alkf", "filter:blur(60px)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::left", [ "::left", [ 0, [ "s1xbl9by", "left:4%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s1fnzz8s", "top:2%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl1i4", "width:44%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxw9yk", "height:42%" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "s1rryo6p", "background-image:radial-gradient(closest-side, rgba(139, 39, 134, 0.5) 0%, transparent 100%)" ] ] ] ] ]), undefined ] ] ];
const tc_blob_c = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sc4alkf", "filter:blur(60px)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::right", [ "::right", [ 0, [ "svx3j0x", "right:-4%" ] ] ] ], [ "::bottom", [ "::bottom", [ 0, [ "sv9p3z1", "bottom:-2%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl1jy", "width:46%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxwa28", "height:46%" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "sqc5kkd", "background-image:radial-gradient(closest-side, rgba(235, 104, 46, 0.45) 0%, transparent 100%)" ] ] ] ] ]), undefined ] ] ];
const tc_spoke_up = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ] ], [ "::transform-origin", [ "::transform-origin", [ 0, [ "soitk1p", "transform-origin:left center" ] ] ] ], [ "::left", [ "::left", [ 0, [ "sr9jof4", "left:210px" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s8i9ux0", "top:70px" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl0ko", "width:1px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wod31f", "height:145px" ] ] ] ] ]), undefined ] ] ];
const tc_spoke_down = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ] ], [ "::transform-origin", [ "::transform-origin", [ 0, [ "soitk1p", "transform-origin:left center" ] ] ] ], [ "::left", [ "::left", [ 0, [ "sr9jof4", "left:210px" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s1vk5h1x", "top:215px" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl0ko", "width:1px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wod31f", "height:145px" ] ] ] ] ]), undefined ] ] ];
const tc_spoke_run = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ] ], [ "::transform-origin", [ "::transform-origin", [ 0, [ "soitk1p", "transform-origin:left center" ] ] ] ], [ "::left", [ "::left", [ 0, [ "sr9jof4", "left:210px" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s1vk5h1x", "top:215px" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s645n5d", "width:154px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxw92y", "height:1px" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "s1cmm6dq", "transform:rotate(-28.2deg)" ] ] ] ] ]), undefined ] ] ];
const tc_spoke_fmt = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ] ], [ "::transform-origin", [ "::transform-origin", [ 0, [ "soitk1p", "transform-origin:left center" ] ] ] ], [ "::left", [ "::left", [ 0, [ "sr9jof4", "left:210px" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s1vk5h1x", "top:215px" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s645mb4", "width:153px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxw92y", "height:1px" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "s1rnupr9", "transform:rotate(28.6deg)" ] ] ] ] ]), undefined ] ] ];
const tc_spoke_lsp = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ] ], [ "::transform-origin", [ "::transform-origin", [ 0, [ "soitk1p", "transform-origin:left center" ] ] ] ], [ "::left", [ "::left", [ 0, [ "sr9jof4", "left:210px" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s1vk5h1x", "top:215px" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s645jsd", "width:150px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxw92y", "height:1px" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "ss7z4r2", "transform:rotate(151deg)" ] ] ] ] ]), undefined ] ] ];
const tc_spoke_upgrade = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "sxiw8k9", "background-color:rgb(from var(--up-bright) r g b / 0.22)" ] ] ] ], [ "::transform-origin", [ "::transform-origin", [ 0, [ "soitk1p", "transform-origin:left center" ] ] ] ], [ "::left", [ "::left", [ 0, [ "sr9jof4", "left:210px" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s1vk5h1x", "top:215px" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s644xxv", "width:147px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxw92y", "height:1px" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "s1tbwy2j", "transform:rotate(-150.3deg)" ] ] ] ] ]), undefined ] ] ];
const tc_chip = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myypq", "gap:var(--space-2)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxoc", "padding-top:var(--space-2)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "s24ary3", "font-size:12.5px" ] ] ] ], [ "::white-space", [ "::white-space", [ 0, [ "s1ctk0je", "white-space:nowrap" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1leb7x8", "background-color:rgb(from var(--down-normal) r g b / 0.92)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s1t4wgdk", "border-radius:999px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s1m3neic", "border:1px solid rgb(from var(--up-bright) r g b / 0.16)" ] ] ] ], [ "::box-shadow", [ "::box-shadow", [ 0, [ "s1oql1iy", "box-shadow:0 6px 28px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "skw0huo", "transform:translate(-50%, -50%)" ] ] ] ] ]), undefined ] ] ];
const led = [ [ [ new Map([ [ "::flex-shrink", [ "::flex-shrink", [ 0, [ "s1lr51x", "flex-shrink:0" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl5m6", "width:7px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxwe4g", "height:7px" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ] ]), undefined ] ] ];
const tc_center_mask = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvtvz", "left:50%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s9a2gv", "top:50%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s64uyum", "width:250px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wocyu6", "height:140px" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "s101azu3", "background-image:radial-gradient(closest-side, rgb(from var(--down-dim) r g b / 0.84) 35%, transparent 100%)" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "skw0huo", "transform:translate(-50%, -50%)" ] ] ] ] ]), undefined ] ] ];
const tc_center = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvtvz", "left:50%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s9a2gv", "top:50%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s644s24", "width:140px" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "skw0huo", "transform:translate(-50%, -50%)" ] ] ] ], [ "::aspect-ratio", [ "::aspect-ratio", [ 0, [ "s1wfw2s5", "aspect-ratio:311 / 64" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "syz58y5", "background-color:var(--up-bright)" ] ] ] ], [ "::-webkit-mask", [ "::-webkit-mask", [ 0, [ "smlee52", "-webkit-mask:url(https://vilan-lang.org/assets/wordmark_hero_light.svg) center / contain no-repeat" ] ] ] ], [ "::mask", [ "::mask", [ 0, [ "satia6u", "mask:url(https://vilan-lang.org/assets/wordmark_hero_light.svg) center / contain no-repeat" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ 0, [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ] ]), undefined ] ] ];
const df_wrap = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiv4i3", "display:none" ] ] ] ], [ "::overflow", [ "::overflow", [ 0, [ "syp1ckj", "overflow:hidden" ] ] ] ], [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxtu", "padding-top:var(--space-8)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyp2", "padding-bottom:var(--space-8)" ] ] ] ], [ "1024px::display", [ "1024px::display", [ 0, [ "s1pon8d1", "display:block" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ] ], [ "::--art-shadow", [ "::--art-shadow", [ 0, [ "s18vcma9", "--art-shadow:var(--shadow)" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ] ]), undefined ] ] ];
const df_blob_a = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sc4alkf", "filter:blur(60px)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::left", [ "::left", [ 0, [ "s1xbl9a4", "left:2%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s8i26ga", "top:-30%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl0k7", "width:30%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x2l5", "height:120%" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "s1ffmfd1", "background-image:radial-gradient(closest-side, rgba(139, 39, 134, 0.45) 0%, transparent 100%)" ] ] ] ] ]), undefined ] ] ];
const df_blob_b = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jge7", "border-radius:50%" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sc4alkf", "filter:blur(60px)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::right", [ "::right", [ 0, [ "smhpc5c", "right:0%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s8i25m1", "top:-20%" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl0nv", "width:34%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x2l5", "height:120%" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "s1534wu5", "background-image:radial-gradient(closest-side, rgba(216, 71, 48, 0.5) 0%, transparent 100%)" ] ] ] ] ]), undefined ] ] ];
const df_row = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyrk", "gap:var(--space-4)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ] ]), undefined ] ] ];
const df_node = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxq6", "padding-top:var(--space-4)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "sh1atvk", "border-radius:12px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ] ], [ "::box-shadow", [ "::box-shadow", [ 0, [ "szsnppy", "box-shadow:0 8px 40px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ] ] ]), undefined ] ] ];
const df_node_lit = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxq6", "padding-top:var(--space-4)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyle", "padding-bottom:var(--space-4)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vhr", "padding-left:var(--space-5)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdrp", "padding-right:var(--space-5)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1leb78h", "background-color:rgb(from var(--down-normal) r g b / 0.88)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "sh1atvk", "border-radius:12px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ] ], [ "::box-shadow", [ "::box-shadow", [ 0, [ "s1atclq1", "box-shadow:0 0 34px rgb(from var(--primary) r g b / 0.25), 0 8px 32px rgb(from var(--art-shadow) r g b / calc(alpha * 0.45))" ] ] ] ], [ "::border-color", [ "::border-color", [ 0, [ "sgud36h", "border-color:rgb(from var(--primary) r g b / 0.6)" ] ] ] ] ]), undefined ] ] ];
const df_tag = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "s22vxtl", "font-size:10.5px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "s1ny1qxg", "letter-spacing:0.1em" ] ] ] ], [ "::text-transform", [ "::text-transform", [ 0, [ "s1s2tj83", "text-transform:uppercase" ] ] ] ], [ "::margin-top", [ "::margin-top", [ 0, [ "snx6qqx", "margin-top:var(--space-1)" ] ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ 0, [ "s1c0tkfh", "margin-bottom:var(--space-1)" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s3a4es", "opacity:0.5" ] ] ] ] ]), undefined ] ] ];
const df_arrow = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::flex", [ "::flex", [ 0, [ "skj5p4u", "flex:1" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyot", "gap:var(--space-1)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ] ]), undefined ] ] ];
const df_arrow_label = [ [ [ new Map([ [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "s23lcvu", "font-size:11.5px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1i5dkrp", "color:var(--primary)" ] ] ] ] ]), undefined ] ] ];
const df_arrow_row = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s178flj9", "width:100%" ] ] ] ] ]), undefined ] ] ];
const code_pre = [ [ [ new Map([ [ "::overflow", [ "::overflow", [ 0, [ "s19aluk0", "overflow:auto" ] ] ] ], [ "::padding", [ "::padding", [ 0, [ "s1ufvrz", "padding:var(--space-5)" ] ] ] ], [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq82np", "line-height:1.65" ] ] ] ], [ "::white-space", [ "::white-space", [ 0, [ "s1oc7mru", "white-space:pre" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jixf", "border-radius:6px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ 0, [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ] ]), undefined ] ] ];
const tk_keyword = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "s1i5dkrp", "color:var(--primary)" ] ] ] ] ]), undefined ] ] ];
const tk_string = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "s9d85rj", "color:var(--accent)" ] ] ] ] ]), undefined ] ] ];
const tk_plain = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ] ]), undefined ] ] ];
const tk_callable = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "s1anp4hp", "color:var(--tint-callable)" ] ] ] ] ]), undefined ] ] ];
const tk_type = [ [ [ new Map([ [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1miqier", "color:var(--up-bright)" ] ] ] ] ]), undefined ] ] ];
const tk_hole = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "s1i5dkrp", "color:var(--primary)" ] ] ] ] ]), undefined ] ] ];
const leaf_style = [ [ [ new Map([ [ "::padding-top", [ "::padding-top", [ 0, [ "sku5qxi", "padding-top:1px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzsqi", "padding-bottom:1px" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "srvufzf", "padding-left:6px" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1rpv33l", "padding-right:6px" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk1zs", "font-size:12px" ] ] ] ], [ "::white-space", [ "::white-space", [ 0, [ "s1ctk0je", "white-space:nowrap" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jh8x", "border-radius:4px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ 0, [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ] ]), undefined ] ] ];
const leaf_link_style = [ [ [ new Map([ [ "::padding-top", [ "::padding-top", [ 0, [ "sku5qxi", "padding-top:1px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzsqi", "padding-bottom:1px" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "srvufzf", "padding-left:6px" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1rpv33l", "padding-right:6px" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk1zs", "font-size:12px" ] ] ] ], [ "::white-space", [ "::white-space", [ 0, [ "s1ctk0je", "white-space:nowrap" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jh8x", "border-radius:4px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ 0, [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1miqier", "color:var(--up-bright)" ] ] ] ], [ "::text-decoration", [ "::text-decoration", [ 0, [ "s1hj754t", "text-decoration:underline dotted rgb(from var(--primary) r g b / 0.7) 1px" ] ] ] ], [ "::text-underline-offset", [ "::text-underline-offset", [ 0, [ "s1jf3qpu", "text-underline-offset:3px" ] ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ 0, [ "s164fd6n", "border-color:var(--primary)" ] ] ] ] ]), undefined ] ] ];
const bloom_field = [ [ [ new Map([ [ "::overflow", [ "::overflow", [ 0, [ "syp1ckj", "overflow:hidden" ] ] ] ], [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s80ttlx", "top:0" ] ] ] ], [ "::left", [ "::left", [ 0, [ "s8k3705", "left:0" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s178flj9", "width:100%" ] ] ] ], [ "::height", [ "::height", [ 0, [ "sbp2tui", "height:calc(64px + clamp(1100px, 100vw, 1920px) * 0.570864)" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::--bloom-plum", [ "::--bloom-plum", [ 0, [ "s1uiy6wn", "--bloom-plum:#95304D" ] ] ] ], [ "::--bloom-violet", [ "::--bloom-violet", [ 0, [ "s6maw3t", "--bloom-violet:#8B2786" ] ] ] ], [ "::--bloom-scarlet", [ "::--bloom-scarlet", [ 0, [ "s176vjaw", "--bloom-scarlet:#D84730" ] ] ] ] ]), undefined ] ] ];
const bloom_drift = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::inset", [ "::inset", [ 0, [ "s1ucbaf9", "inset:0" ] ] ] ], [ "::animation", [ "::animation", [ 0, [ "s1u16gt0", "animation:bloom-drift-a 44s ease-in-out infinite alternate" ] ] ] ] ]), undefined ] ] ];
const bloom_blurwrap = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::inset", [ "::inset", [ 0, [ "s1ucbaf9", "inset:0" ] ] ] ], [ "::filter", [ "::filter", [ 0, [ "sdxlu80", "filter:blur(calc(clamp(1100px, 100vw, 1920px) * 0.052)) saturate(1.25) brightness(1.12) url(#bloom-texture)" ] ] ] ] ]), undefined ] ] ];
const bloom_gradient = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvtvz", "left:50%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s1ppzw09", "top:calc(64px - clamp(1100px, 100vw, 1920px) * 0.049226)" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s183om2p", "width:clamp(1100px, 100vw, 1920px)" ] ] ] ], [ "::height", [ "::height", [ 0, [ "sst8zpc", "height:calc(clamp(1100px, 100vw, 1920px) * 0.62009)" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "s183tt1x", "transform:translateX(-50%)" ] ] ] ], [ "::-webkit-mask-size", [ "::-webkit-mask-size", [ 0, [ "sdml5s3", "-webkit-mask-size:100% 100%" ] ] ] ], [ "::mask-size", [ "::mask-size", [ 0, [ "s14catfn", "mask-size:100% 100%" ] ] ] ], [ "::-webkit-mask-image", [ "::-webkit-mask-image", [ 0, [ "ss9iuu0", "-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E  %3C/svg%3E \")" ] ] ] ], [ "::mask-image", [ "::mask-image", [ 0, [ "sk413s", "mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E  %3C/svg%3E \")" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "siub6a0", "background-image:radial-gradient(30% 10% ellipse at 61% 24%, rgb(226 184 231), rgb(247 229 249 / 70%) 74%, transparent 80%), radial-gradient(42% 40% ellipse at 62% 40%, rgb(255 106 0 / 95%), rgb(217 118 48 / 65%) 50%, transparent 78%), radial-gradient(61% 67% ellipse at 23% 48%, rgb(175 38 168 / 95%), rgb(237 64 7 / 60%) 45%, transparent 76%), radial-gradient(40% 46% ellipse at 92% 48%, rgba(216, 71, 48, 0.95), rgba(216, 71, 48, 0.7) 45%, transparent 78%), radial-gradient(26% 40% ellipse at 2% 50%, rgba(216, 71, 48, 0.9), transparent 74%), radial-gradient(36% 26% ellipse at 45% 78%, rgba(178, 48, 86, 0.7), transparent 76%), radial-gradient(22% 20% ellipse at 20% 84%, rgba(103, 34, 131, 0.8), transparent 74%), linear-gradient(100deg, var(--bloom-plum) 0%, var(--bloom-violet) 25%, var(--primary) 55%, var(--bloom-scarlet) 85%, var(--bloom-scarlet) 100%)" ] ] ] ], [ "::background-size", [ "::background-size", [ 0, [ "s1as7syx", "background-size:calc(clamp(1100px, 100vw, 1920px) * 0.78125) calc(clamp(1100px, 100vw, 1920px) * 0.78125)" ] ] ] ] ]), undefined ] ] ];
const bloom_duo = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::left", [ "::left", [ 0, [ "semvtvz", "left:50%" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s1ppzw09", "top:calc(64px - clamp(1100px, 100vw, 1920px) * 0.049226)" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s183om2p", "width:clamp(1100px, 100vw, 1920px)" ] ] ] ], [ "::height", [ "::height", [ 0, [ "sst8zpc", "height:calc(clamp(1100px, 100vw, 1920px) * 0.62009)" ] ] ] ], [ "::transform", [ "::transform", [ 0, [ "s183tt1x", "transform:translateX(-50%)" ] ] ] ], [ "::-webkit-mask-size", [ "::-webkit-mask-size", [ 0, [ "sdml5s3", "-webkit-mask-size:100% 100%" ] ] ] ], [ "::mask-size", [ "::mask-size", [ 0, [ "s14catfn", "mask-size:100% 100%" ] ] ] ], [ "::-webkit-mask-image", [ "::-webkit-mask-image", [ 0, [ "sthis8v", "-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg filter=\'url(%23filter0_f_51_26)\'%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E %3Cdefs%3E %3Cfilter id=\'filter0_f_51_26\' x=\'0\' y=\'-92.4345\' width=\'1877.72\' height=\'1164.39\' filterUnits=\'userSpaceOnUse\' color-interpolation-filters=\'sRGB\'%3E %3CfeFlood flood-opacity=\'0\' result=\'BackgroundImageFix\'/%3E %3CfeBlend mode=\'normal\' in=\'SourceGraphic\' in2=\'BackgroundImageFix\' result=\'shape\'/%3E %3CfeGaussianBlur stdDeviation=\'100\' result=\'effect1_foregroundBlur_51_26\'/%3E %3C/filter%3E %3C/defs%3E %3C/svg%3E \")" ] ] ] ], [ "::mask-image", [ "::mask-image", [ 0, [ "sfm8fb3", "mask-image:url(\"data:image/svg+xml,%3Csvg width=\'1877.72\' height=\'1164.39\' viewBox=\'0 -92.4345 1877.72 1164.39\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E %3Cg filter=\'url(%23filter0_f_51_26)\'%3E %3Cpath d=\'M708.762 806.63C717.203 788.527 770.245 793.449 798.513 806.63C826.78 819.811 819.569 836.26 811.127 854.363C802.685 872.466 737.029 877.819 708.762 864.638C680.494 851.456 700.32 824.733 708.762 806.63Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1196.04 124.964C1286.06 124.964 1359.04 189.435 1359.04 268.964C1359.03 296.719 1350.14 322.638 1334.74 344.625C1351.59 383.759 1357.54 431.665 1357.54 489.334C1357.54 534.115 1357.52 568.181 1353.65 594.069C1505.65 471.69 1705.07 359.683 1504.42 524.754C1392.08 633.435 1709.16 555.443 1675.16 702.715C1631.58 790.249 1402.9 657.226 1406.64 823.488C1245.88 908.901 1198.47 792.736 1219.88 735.235C1226.55 717.315 1244.29 694.6 1268.59 669.77C1211.94 677.661 1119.22 674.039 967.451 674.039C837.02 674.039 741.487 667.658 672.1 651.83C602.114 708.686 502.736 737.543 407.269 742.508C227.5 767.999 218.763 641.243 207.5 512.5C270 442.5 361.5 454.932 447.5 334.323C465.97 332.707 484.168 331.352 501.937 330.399C512.635 216.95 571.044 199.869 889.93 199.869C950.307 199.869 1003.2 201.81 1049.48 205.865C1075.95 157.963 1131.63 124.964 1196.04 124.964Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M202.603 243.749C212.325 222.901 246.437 218.231 278.794 233.319C311.151 248.408 329.5 277.54 319.778 298.389C310.056 319.237 275.945 323.907 243.588 308.818C211.231 293.73 192.882 264.597 202.603 243.749Z\' fill=\'%23D9D9D9\'/%3E %3Cpath d=\'M1397.41 130.335C1407.02 109.717 1433.28 101.615 1456.07 112.239C1478.85 122.864 1489.53 148.19 1479.91 168.808C1470.3 189.427 1444.03 197.528 1421.25 186.904C1398.47 176.28 1387.79 150.953 1397.41 130.335Z\' fill=\'%23D9D9D9\'/%3E %3C/g%3E %3Cdefs%3E %3Cfilter id=\'filter0_f_51_26\' x=\'0\' y=\'-92.4345\' width=\'1877.72\' height=\'1164.39\' filterUnits=\'userSpaceOnUse\' color-interpolation-filters=\'sRGB\'%3E %3CfeFlood flood-opacity=\'0\' result=\'BackgroundImageFix\'/%3E %3CfeBlend mode=\'normal\' in=\'SourceGraphic\' in2=\'BackgroundImageFix\' result=\'shape\'/%3E %3CfeGaussianBlur stdDeviation=\'100\' result=\'effect1_foregroundBlur_51_26\'/%3E %3C/filter%3E %3C/defs%3E %3C/svg%3E \")" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "s13ldclz", "background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E %3Cfilter id=\'d\' x=\'0\' y=\'0\' width=\'100%25\' height=\'100%25\' color-interpolation-filters=\'sRGB\'%3E %3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'2\' numOctaves=\'3\' seed=\'3214\' stitchTiles=\'stitch\' result=\'n\'/%3E %3CfeColorMatrix in=\'n\' type=\'matrix\' values=\'1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1\' result=\'n1\'/%3E %3CfeColorMatrix in=\'n1\' type=\'luminanceToAlpha\' result=\'a\'/%3E %3CfeComponentTransfer in=\'a\' result=\'m1\'%3E%3CfeFuncA type=\'discrete\' tableValues=\'1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\'/%3E%3C/feComponentTransfer%3E %3CfeFlood flood-color=\'%23262324\' result=\'f1\'/%3E %3CfeComposite in=\'f1\' in2=\'m1\' operator=\'in\' result=\'dark\'/%3E %3CfeComponentTransfer in=\'a\' result=\'m2\'%3E%3CfeFuncA type=\'discrete\' tableValues=\'0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\'/%3E%3C/feComponentTransfer%3E %3CfeFlood flood-color=\'rgba(255, 89, 0, 0.57)\' result=\'f2\'/%3E %3CfeComposite in=\'f2\' in2=\'m2\' operator=\'in\' result=\'orange\'/%3E %3CfeMerge%3E%3CfeMergeNode in=\'dark\'/%3E%3CfeMergeNode in=\'orange\'/%3E%3C/feMerge%3E %3C/filter%3E %3Crect width=\'120\' height=\'120\' filter=\'url(%2523d)\'/%3E %3C/svg%3E\")" ] ] ] ], [ "::background-size", [ "::background-size", [ 0, [ "skugn91", "background-size:120px 120px" ] ] ] ], [ "::mix-blend-mode", [ "::mix-blend-mode", [ 0, [ "s1ddx1v8", "mix-blend-mode:soft-light" ] ] ] ] ]), undefined ] ] ];
const masthead_wrap = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ] ]), undefined ] ] ];
const hero_block = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s1pnyybd", "gap:calc(clamp(1100px, 100vw, 1920px) * 0.03333)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "srk904b", "padding-top:calc(clamp(1100px, 100vw, 1920px) * 0.15208)" ] ] ] ], [ "::height", [ "::height", [ 0, [ "ss654zr", "height:calc(clamp(1100px, 100vw, 1920px) * 0.52917)" ] ] ] ], [ "::box-sizing", [ "::box-sizing", [ 0, [ "s9fgd5j", "box-sizing:border-box" ] ] ] ] ]), undefined ] ] ];
const hero_mark = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "s1t71824", "width:calc(clamp(1100px, 100vw, 1920px) * 0.05208)" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s23znoa", "height:auto" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ 0, [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ] ]), undefined ] ] ];
const hero_wordmark = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "s1tv0w0m", "width:calc(clamp(1100px, 100vw, 1920px) * 0.16198)" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s23znoa", "height:auto" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ 0, [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ] ]), undefined ] ] ];
const hero_tagline = [ [ [ new Map([ [ "::font-family", [ "::font-family", [ 0, [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "s169txcv", "font-size:max(18px, clamp(1100px, 100vw, 1920px) * 0.01667)" ] ] ] ], [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "s9bu6v3", "line-height:1.5" ] ] ] ], [ "::text-align", [ "::text-align", [ 0, [ "s17ya8sq", "text-align:center" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s15t7ncn", "color:#120004" ] ] ] ] ]), undefined ] ] ];
const install_label = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk1zs", "font-size:12px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "s1odj0cm", "letter-spacing:0.12em" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1i5dkrp", "color:var(--primary)" ] ] ] ], [ "::text-transform", [ "::text-transform", [ 0, [ "s1s2tj83", "text-transform:uppercase" ] ] ] ], [ "::margin-top", [ "::margin-top", [ 0, [ "snx6qqx", "margin-top:var(--space-1)" ] ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ 0, [ "s1c0tkfh", "margin-bottom:var(--space-1)" ] ] ] ] ]), undefined ] ] ];
const install_command = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s16f1e6t", "position:relative" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jixf", "border-radius:6px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ 0, [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ] ]), undefined ] ] ];
const install_command_text = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sowfjmu", "display:block" ] ] ] ], [ "::overflow", [ "::overflow", [ 0, [ "s19aluk0", "overflow:auto" ] ] ] ], [ "::scrollbar-width", [ "::scrollbar-width", [ 0, [ "shop8ox", "scrollbar-width:none" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxp9", "padding-top:var(--space-3)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiykh", "padding-bottom:var(--space-3)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s1vtes9o", "padding-left:16px" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s16t5edj", "padding-right:48px" ] ] ] ], [ "::white-space", [ "::white-space", [ 0, [ "s1oc7mru", "white-space:pre" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "svsrq00", "user-select:all" ] ] ] ] ]), undefined ] ] ];
const copy_button = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s9a503", "top:6px" ] ] ] ], [ "::right", [ "::right", [ 0, [ "svx3tuz", "right:8px" ] ] ] ], [ "::justify-content", [ "::justify-content", [ 0, [ "s1d7ek7w", "justify-content:center" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s178gloh", "width:28px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22y11v", "height:28px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jklx", "border-radius:8px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "spw2fur", "transition:border-color 80ms ease, transform 80ms ease" ] ] ] ], [ "::cursor", [ "::cursor", [ 0, [ "s1onu0uk", "cursor:pointer" ] ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ 0, [ "s164fd6n", "border-color:var(--primary)" ] ] ] ], [ ":active:transform", [ ":active:transform", [ 0, [ "s4vadk5", "transform:scale(0.92)" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ] ]), undefined ] ] ];
const copy_icon = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "s178frfh", "width:15px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x6sv", "height:15px" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ 0, [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ] ]), undefined ] ] ];
const install_grid = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyrk", "gap:var(--space-4)" ] ] ] ], [ "::min-width", [ "::min-width", [ 0, [ "sitgfdt", "min-width:0" ] ] ] ] ]), undefined ] ] ];
const install_split = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbipssh", "display:grid" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyv8", "gap:var(--space-8)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ 0, [ "s1o6spkj", "grid-template-columns:6fr 5fr" ] ] ] ], [ "::--reveal", [ "::--reveal", [ 0, [ "s1wraoya", "--reveal:1" ] ] ] ] ]), undefined ] ] ];
const install_art_cell = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiv4i3", "display:none" ] ] ] ], [ "1024px::display", [ "1024px::display", [ 0, [ "s1pon8d1", "display:block" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ] ]), undefined ] ] ];
const showcase_grid = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbipssh", "display:grid" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyv8", "gap:var(--space-8)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ 0, [ "s12tw3cj", "grid-template-columns:5fr 6fr" ] ] ] ], [ "::--reveal", [ "::--reveal", [ 0, [ "s1wraoya", "--reveal:1" ] ] ] ] ]), undefined ] ] ];
const showcase_grid_flipped = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbipssh", "display:grid" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyv8", "gap:var(--space-8)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ 0, [ "s1o6spkj", "grid-template-columns:6fr 5fr" ] ] ] ], [ "::--reveal", [ "::--reveal", [ 0, [ "s1wraoya", "--reveal:1" ] ] ] ] ]), undefined ] ] ];
const showcase_copy = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyqn", "gap:var(--space-3)" ] ] ] ] ]), undefined ] ] ];
const demo_box = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyrk", "gap:var(--space-4)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::padding", [ "::padding", [ 0, [ "s1ufvr2", "padding:var(--space-4)" ] ] ] ], [ "::margin-top", [ "::margin-top", [ 0, [ "snx6qto", "margin-top:var(--space-4)" ] ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ 0, [ "s1c0tki8", "margin-bottom:var(--space-4)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jixf", "border-radius:6px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ] ] ]), undefined ] ] ];
const demo_button = [ [ [ new Map([ [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxoc", "padding-top:var(--space-2)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s30khfz", "color:var(--primary-on)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s19dy6kf", "background-color:var(--primary)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jixf", "border-radius:6px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s1mnphwb", "border:none" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "svhwf6a", "transition:opacity 80ms ease, transform 80ms ease" ] ] ] ], [ "::cursor", [ "::cursor", [ 0, [ "s1onu0uk", "cursor:pointer" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ ":hover:opacity", [ ":hover:opacity", [ 0, [ "s1eayhf7", "opacity:0.88" ] ] ] ], [ ":active:transform", [ ":active:transform", [ 0, [ "s4vadmw", "transform:scale(0.95)" ] ] ] ] ]), undefined ] ] ];
const demo_label = [ [ [ new Map([ [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ] ]), undefined ] ] ];
const diag_pre = [ [ [ new Map([ [ "::overflow", [ "::overflow", [ 0, [ "s19aluk0", "overflow:auto" ] ] ] ], [ "::padding", [ "::padding", [ 0, [ "s1ufvrz", "padding:var(--space-5)" ] ] ] ], [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq82np", "line-height:1.65" ] ] ] ], [ "::white-space", [ "::white-space", [ 0, [ "s1oc7mru", "white-space:pre" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jixf", "border-radius:6px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "szq4juv", "border:1px solid rgb(from var(--primary) r g b / 0.35)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ 0, [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ] ]), undefined ] ] ];
const diag_error = [ [ [ new Map([ [ "::font-weight", [ "::font-weight", [ 0, [ "skjzhdq", "font-weight:700" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1i5dkrp", "color:var(--primary)" ] ] ] ] ]), undefined ] ] ];
const diag_frame = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "shpfnhp", "color:var(--up-dim)" ] ] ] ] ]), undefined ] ] ];
const diag_stack = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyqn", "gap:var(--space-3)" ] ] ] ], [ "::min-width", [ "::min-width", [ 0, [ "sitgfdt", "min-width:0" ] ] ] ] ]), undefined ] ] ];
const cards_grid = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbipssh", "display:grid" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyrk", "gap:var(--space-4)" ] ] ] ], [ "::background", [ "::background", [ 0, [ "sz4tuoy", "background:radial-gradient(340px circle at var(--glow-x, -999px) var(--glow-y, -999px), rgb(from var(--primary) r g b / 0.10), transparent 70%)" ] ] ] ], [ "640px::grid-template-columns", [ "640px::grid-template-columns", [ 0, [ "sc664m5", "grid-template-columns:1fr 1fr" ] ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ 0, [ "srts5oz", "grid-template-columns:1fr 1fr 1fr" ] ] ] ], [ "::--reveal", [ "::--reveal", [ 0, [ "s1wraoya", "--reveal:1" ] ] ] ] ]), undefined ] ] ];
const card = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myypq", "gap:var(--space-2)" ] ] ] ], [ "::padding", [ "::padding", [ 0, [ "s1ufvrz", "padding:var(--space-5)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jixf", "border-radius:6px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s84iv6f", "border:1px solid var(--stroke-hard)" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "s1g9l6sx", "transition:background-color 160ms ease, border-color 160ms ease" ] ] ] ], [ ":hover:background-color", [ ":hover:background-color", [ 0, [ "s3ujeas", "background-color:var(--down-bright)" ] ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ 0, [ "s18zucc0", "border-color:rgb(from var(--primary) r g b / 0.45)" ] ] ] ] ]), undefined ] ] ];
const card_title = [ [ [ new Map([ [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayks1j", "font-size:20px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq94bh", "line-height:28px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1miqier", "color:var(--up-bright)" ] ] ] ] ]), undefined ] ] ];
const card_body = [ [ [ new Map([ [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ] ]), undefined ] ] ];
const card_link = [ [ [ new Map([ [ "::align-self", [ "::align-self", [ 0, [ "szfo4l9", "align-self:flex-start" ] ] ] ], [ "::display", [ "::display", [ 0, [ "s2m9jw6", "display:inline-flex" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyot", "gap:var(--space-1)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1i5dkrp", "color:var(--primary)" ] ] ] ], [ "::text-decoration", [ "::text-decoration", [ 0, [ "svrgm1f", "text-decoration:none" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ ":hover:text-decoration", [ ":hover:text-decoration", [ 0, [ "s10pnzzh", "text-decoration:underline" ] ] ] ] ]), undefined ] ] ];
const link_arrow = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "s178fql8", "width:14px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x5ym", "height:14px" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ 0, [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ] ]), undefined ] ] ];
const button_link_style = [ [ [ new Map([ [ "::align-self", [ "::align-self", [ 0, [ "szfo4l9", "align-self:flex-start" ] ] ] ], [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyot", "gap:var(--space-1)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxoc", "padding-top:var(--space-2)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyjk", "padding-bottom:var(--space-2)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vgu", "padding-left:var(--space-4)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdqs", "padding-right:var(--space-4)" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1i5dkrp", "color:var(--primary)" ] ] ] ], [ "::text-decoration", [ "::text-decoration", [ 0, [ "svrgm1f", "text-decoration:none" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jixf", "border-radius:6px" ] ] ] ], [ "::border", [ "::border", [ 0, [ "szq4kp4", "border:1px solid rgb(from var(--primary) r g b / 0.45)" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "s1g9l6sx", "transition:background-color 160ms ease, border-color 160ms ease" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ ":hover:background-color", [ ":hover:background-color", [ 0, [ "s12y9rv2", "background-color:rgb(from var(--primary) r g b / 0.12)" ] ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ 0, [ "s164fd6n", "border-color:var(--primary)" ] ] ] ] ]), undefined ] ] ];
const card_icon = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "s178gloh", "width:28px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22y11v", "height:28px" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ 0, [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ] ]), undefined ] ] ];
const dogfood_text = [ [ [ new Map([ [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk4ij", "font-size:15px" ] ] ] ], [ "::text-align", [ "::text-align", [ 0, [ "s17ya8sq", "text-align:center" ] ] ] ] ]), undefined ] ] ];
const dogfood_cta = [ [ [ new Map([ [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::text-align", [ "::text-align", [ 0, [ "s17ya8sq", "text-align:center" ] ] ] ] ]), undefined ] ] ];
const footer_block = [ [ [ new Map([ [ "::padding-top", [ "::padding-top", [ 0, [ "sxfkz7k", "padding-top:128px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1ill0x0", "padding-bottom:128px" ] ] ] ], [ "::border-top", [ "::border-top", [ 0, [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ] ] ]), undefined ] ] ];
const footer_grid = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbipssh", "display:grid" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyv8", "gap:var(--space-8)" ] ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ 0, [ "s18vdyd9", "grid-template-columns:2fr 1fr 1fr 1fr" ] ] ] ] ]), undefined ] ] ];
const footer_head = [ [ [ new Map([ [ "::margin-top", [ "::margin-top", [ 0, [ "snx6qru", "margin-top:var(--space-2)" ] ] ] ], [ "::margin-bottom", [ "::margin-bottom", [ 0, [ "s1c0tkge", "margin-bottom:var(--space-2)" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1miqier", "color:var(--up-bright)" ] ] ] ] ]), undefined ] ] ];
const footer_list = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myypq", "gap:var(--space-2)" ] ] ] ] ]), undefined ] ] ];
const footer_link = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "shpfnhp", "color:var(--up-dim)" ] ] ] ], [ "::text-decoration", [ "::text-decoration", [ 0, [ "svrgm1f", "text-decoration:none" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "sbcnc8a", "transition:color 80ms ease" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ ":hover:color", [ ":hover:color", [ 0, [ "s1ytnaev", "color:var(--up-bright)" ] ] ] ], [ ":hover:text-decoration", [ ":hover:text-decoration", [ 0, [ "s10pnzzh", "text-decoration:underline" ] ] ] ] ]), undefined ] ] ];
const footer_mark = [ [ [ new Map([ [ "::align-self", [ "::align-self", [ 0, [ "s1dnt31w", "align-self:center" ] ] ] ], [ "::justify-self", [ "::justify-self", [ 0, [ "s1mm88t6", "justify-self:center" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ 0, [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ] ]), undefined ] ] ];
const footer_micro = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::justify-content", [ "::justify-content", [ 0, [ "s1yv3ji6", "justify-content:space-between" ] ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ 0, [ "szotvx1", "flex-wrap:wrap" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myypq", "gap:var(--space-2)" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "stbzxs0", "padding-top:var(--space-6)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1sgiyn8", "padding-bottom:var(--space-6)" ] ] ] ], [ "::margin-top", [ "::margin-top", [ 0, [ "s83cg9u", "margin-top:96px" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk1zs", "font-size:12px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "shpfnhp", "color:var(--up-dim)" ] ] ] ], [ "::border-top", [ "::border-top", [ 0, [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ] ] ]), undefined ] ] ];
const primary = [ "var(--primary)", ":root{--primary:#EB682E}@media (prefers-color-scheme: light){:root{--primary:#AE3611}}" ];
const accent = [ "var(--accent)", ":root{--accent:#E5AFD9}@media (prefers-color-scheme: light){:root{--accent:#922A7C}}" ];
const assets = "https://vilan-lang.org/assets";
const repo = "https://github.com/vilan-lang/vilan";
const shell = [ [ [ new Map([ [ "::min-height", [ "::min-height", [ 0, [ "sondrfd", "min-height:100%" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk3oa", "font-size:14px" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8cl8", "line-height:18px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ] ] ]), undefined ] ] ];
const column = [ [ [ new Map([ [ "::padding-left", [ "::padding-left", [ 0, [ "s1vtg8d6", "padding-left:32px" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s16t4hls", "padding-right:32px" ] ] ] ], [ "::margin-left", [ "::margin-left", [ 0, [ "s10oplpw", "margin-left:auto" ] ] ] ], [ "::margin-right", [ "::margin-right", [ 0, [ "sp4tc1m", "margin-right:auto" ] ] ] ], [ "::max-width", [ "::max-width", [ 0, [ "s1eamei2", "max-width:1264px" ] ] ] ] ]), undefined ] ] ];
const no_drag = [ [ [ new Map([ [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ 0, [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ] ]), undefined ] ] ];
const section_block = [ [ [ new Map([ [ "::padding-top", [ "::padding-top", [ 0, [ "s18lh5xs", "padding-top:var(--space-24)" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1v942yc", "padding-bottom:var(--space-24)" ] ] ] ] ]), undefined ] ] ];
const stack = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyrk", "gap:var(--space-4)" ] ] ] ] ]), undefined ] ] ];
const reveal = [ [ [ new Map([ [ "::--reveal", [ "::--reveal", [ 0, [ "s1wraoya", "--reveal:1" ] ] ] ] ]), undefined ] ] ];
const heading = [ [ [ new Map([ [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "seyay0p", "font-family:\'Vilan Display\', system-ui, -apple-system, sans-serif" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayllga", "font-size:32px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snqanrz", "line-height:48px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1miqier", "color:var(--up-bright)" ] ] ] ], [ "::--reveal", [ "::--reveal", [ 0, [ "s1wraoya", "--reveal:1" ] ] ] ] ]), undefined ] ] ];
const lead = [ [ [ new Map([ [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::max-width", [ "::max-width", [ 0, [ "s1pu2qte", "max-width:36rem" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::--reveal", [ "::--reveal", [ 0, [ "s1wraoya", "--reveal:1" ] ] ] ] ]), undefined ] ] ];
const rule_line = [ [ [ new Map([ [ "::height", [ "::height", [ 0, [ "s1wxw92y", "height:1px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1hcpyu4", "background-color:var(--stroke-soft)" ] ] ] ] ]), undefined ] ] ];
const grain_overlay = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::inset", [ "::inset", [ 0, [ "s1ucbaf9", "inset:0" ] ] ] ], [ "::opacity", [ "::opacity", [ 0, [ "s30a1l5", "opacity:0.55" ] ] ] ], [ "::mix-blend-mode", [ "::mix-blend-mode", [ 0, [ "sc8sqhh", "mix-blend-mode:overlay" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "s192ko3e", "background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'240\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'240\' height=\'240\' filter=\'url(%23n)\' opacity=\'0.55\'/%3E%3C/svg%3E\")" ] ] ] ], [ "::pointer-events", [ "::pointer-events", [ 0, [ "s171fk3p", "pointer-events:none" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ] ]), undefined ] ] ];
const visually_hidden = [ [ [ new Map([ [ "::overflow", [ "::overflow", [ 0, [ "syp1ckj", "overflow:hidden" ] ] ] ], [ "::position", [ "::position", [ 0, [ "s58iza0", "position:absolute" ] ] ] ], [ "::width", [ "::width", [ 0, [ "sgdl0ko", "width:1px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s1wxw92y", "height:1px" ] ] ] ], [ "::clip-path", [ "::clip-path", [ 0, [ "sx3450x", "clip-path:inset(50%)" ] ] ] ] ]), undefined ] ] ];
const topbar = [ [ [ new Map([ [ "::position", [ "::position", [ 0, [ "s1onro1c", "position:sticky" ] ] ] ], [ "::top", [ "::top", [ 0, [ "s80ttlx", "top:0" ] ] ] ], [ "::z-index", [ "::z-index", [ 0, [ "si5ywm6", "z-index:100" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1dq5yi8", "background-color:rgb(from var(--down-dim) r g b / calc(var(--nav-fade, 0) * 0.86))" ] ] ] ], [ "::border-bottom", [ "::border-bottom", [ 0, [ "sc9brgc", "border-bottom:1px solid rgb(from var(--stroke-hard) r g b / calc(var(--nav-fade, 0) * 0.9))" ] ] ] ], [ "::backdrop-filter", [ "::backdrop-filter", [ 0, [ "shx44pg", "backdrop-filter:blur(calc(var(--nav-fade, 0) * 14px))" ] ] ] ] ]), undefined ] ] ];
const nav_row = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::justify-content", [ "::justify-content", [ 0, [ "s1yv3ji6", "justify-content:space-between" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s2310lv", "height:64px" ] ] ] ] ]), undefined ] ] ];
const nav_brand = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyqn", "gap:var(--space-3)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "s1odkmbv", "letter-spacing:0.35em" ] ] ] ] ]), undefined ] ] ];
const nav_mark = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sowfjmu", "display:block" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s178hbq8", "width:36px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x9bm", "height:18px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "syz58y5", "background-color:var(--up-bright)" ] ] ] ], [ "::-webkit-mask", [ "::-webkit-mask", [ 0, [ "scqkrg6", "-webkit-mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ] ], [ "::mask", [ "::mask", [ 0, [ "s11mtiwm", "mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ] ] ]), undefined ] ] ];
const nav_links = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyte", "gap:var(--space-6)" ] ] ] ] ]), undefined ] ] ];
const nav_link = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::text-decoration", [ "::text-decoration", [ 0, [ "svrgm1f", "text-decoration:none" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "sbcnc8a", "transition:color 80ms ease" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ ":hover:color", [ ":hover:color", [ 0, [ "s1ytnaev", "color:var(--up-bright)" ] ] ] ] ]), undefined ] ] ];
const scroll_fade = new5("0", "src/client.vl:117:28");
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
let $dx = null;
if (!(reduced_motion)) {
	for (const target of targets) {
		if (target.getBoundingClientRect().top > viewport - 40.0) {
			target.style.setProperty("opacity", "0");
			target.style.setProperty("transform", "translateY(28px)");
		}
	}
	$dx = undefined;
}
$dx;
const publish = () => {
	return turn([ 1 ], ($dy) => {
		const progress = Math.max(Math.min(probe.scrollTop / 64.0, 1.0), 0.0);
		set(scroll_fade, "" + progress, [ 0, $dy ], "src/client.vl:146:15");
		let $dz = null;
		if (!(reduced_motion)) {
			const line = probe.clientHeight * 0.92;
			for (const target2 of targets) {
				if (target2.getBoundingClientRect().top < line) {
					target2.style.setProperty("transition", "opacity 600ms ease, transform 600ms ease");
					target2.style.setProperty("opacity", "1");
					target2.style.setProperty("transform", "none");
				}
			}
			$dz = undefined;
		}
		return $dz;
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
//# sourceMappingURL=client.js.map
