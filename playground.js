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
function __dom_cut_run(after, before) {
	const fragment = document.createDocumentFragment();
	for (let node = after.nextSibling; node !== null && node !== before; ) {
		const next = node.nextSibling;
		fragment.appendChild(node);
		node = next;
	}
	return fragment;
}
function __dom_remove_run(from, before) {
	for (let node = from; node !== null && node !== before; ) {
		const next = node.nextSibling;
		node.remove();
		node = next;
	}
}
function __dom_run_holds(nodes, node) {
	for (let walk = node; walk !== null; walk = walk.parentNode) {
		if (nodes.has(walk)) return true;
	}
	return false;
}
function __dom_run_nodes(from, before) {
	const nodes = new Set();
	for (let node = from; node !== null && node !== before; node = node.nextSibling) nodes.add(node);
	return nodes;
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
	const $aY = turn2;
	let $aZ = null;
	if ($aY[0] === 0) {
		const ambient = $aY[1];
		$aZ = enqueue(ambient, [ reissued(subscriber) ]);
	} else {
		const $ba = last(draining_turns.v);
		let $bb = null;
		if ($ba[0] === 0) {
			const draining = $ba[1];
			$bb = enqueue(draining, [ reissued(subscriber) ]);
		} else {
			if (subscriber[2].v) {
				subscriber[1]();
			}
			$bb = undefined;
		}
		$aZ = $bb;
	}
	return $aZ;
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
		releasing_turns.v.push(__clone(ambient));
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
	let $ah = null;
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
		$ah = undefined;
	}
	return $ah;
}
function renew(self) {
	const $aw = self[0].v[3];
	let $ax = null;
	if ($aw[0] === 0) {
		const nursery2 = __clone($aw[1]);
		let $ay = null;
		if (has_spawned(nursery2)) {
			$ay = [ 1 ];
		} else {
			$ay = [ 0, nursery2 ];
		}
		$ax = $ay;
	} else {
		$ax = [ 1 ];
	}
	const carried = $ax;
	advance([ self[0], self[0].v[0] ], carried);
	if (is_none(self[0].v[3])) {
		run_nurseries_allocated_count.v = run_nurseries_allocated_count.v + 1;
		self[0].v[3] = [ 0, detached_nursery() ];
	}
	return [ self[0], self[0].v[0] ];
}
function nursery(self) {
	let $aJ = null;
	if (is_disposed(self)) {
		$aJ = [ 1 ];
	} else {
		$aJ = self[0].v[3];
	}
	return $aJ;
}
function dispose2(self) {
	advance(self, [ 1 ]);
}
function advance(self, carried) {
	let $aI = null;
	if (!(is_disposed(self))) {
		const held = self[0].v;
		self[0].v = [ self[1] + 1, no_cleanups, false, __clone(carried) ];
		const $az = held[3];
		let $aA = null;
		if ($az[0] === 0) {
			const nursery2 = $az[1];
			if (is_none(carried)) {
				nursery2.cancel();
			}
			$aA = undefined;
		} else {
			$aA = undefined;
		}
		$aA;
		let $aH = null;
		if (held[2]) {
			let failure = [ 1 ];
			for (const cleanup of held[1].v) {
				const $aC = __guarded(cleanup);
				let $aD = null;
				if ($aC[0] === 0) {
					const message = $aC[1];
					if (is_none(failure)) {
						failure = [ 0, message ];
					}
					$aD = undefined;
				} else {
					$aD = undefined;
				}
				$aD;
			}
			const $aF = failure;
			let $aG = null;
			if ($aF[0] === 0) {
				const message2 = $aF[1];
				$aG = (() => {
					throw __panic(message2, "std/src/reactive.vl:1294:27");
				})();
			} else {
				$aG = undefined;
			}
			$aH = $aG;
		}
		$aI = $aH;
	}
	return $aI;
}
function get_owner($ag) {
	return $ag;
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
	const $ar = tracker[0].v[6];
	let $as = null;
	if ($ar[0] === 0) {
		const lists = $ar[1];
		if (!(is_empty(lists.v[0]))) {
			lists.v[0] = [  ];
		}
		$as = undefined;
	} else {
		$as = undefined;
	}
	$as;
	return [ __clone(tracker), epoch ];
}
function close_run(tracker) {
	tracker[0].v[1] = false;
	const $aO = tracker[0].v[6];
	let $aP = null;
	if ($aO[0] === 0) {
		const lists = $aO[1];
		$aP = lists;
	} else {
		return;
		$aP = undefined;
	}
	const lists2 = $aP;
	const $aQ = tracker[0].v[5];
	let $aR = null;
	if ($aQ[0] === 0) {
		const target = __clone($aQ[1]);
		$aR = reconnect(tracker, lists2, target);
	} else {
		if (!(is_empty(lists2.v[0])) || !(is_empty(lists2.v[1]))) {
			lists2.v[1] = __clone(lists2.v[0]);
		}
		$aR = undefined;
	}
	$aR;
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
		const $aW = reusable(held, kept, dependency[0], position);
		let $aX = null;
		if ($aW[0] === 0) {
			const index = $aW[1];
			__at_put(kept, index, true, "std/src/reactive.vl:1715:5");
			next.push(__clone(__at(held, index, "std/src/reactive.vl:1716:15")));
			$aX = undefined;
		} else {
			next.push([ __clone(dependency[0]), dependency[1](relay_for(tracker, target)) ]);
			$aX = undefined;
		}
		$aX;
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
	const $aS = identity;
	let $aT = null;
	if ($aS[0] === 0) {
		const wanted = $aS[1];
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
		$aT = [ 1 ];
	} else {
		$aT = [ 1 ];
	}
	return $aT;
}
function same_identity(identity, wanted) {
	const $aU = identity;
	let $aV = null;
	if ($aU[0] === 0) {
		const held = $aU[1];
		$aV = held === wanted;
	} else {
		$aV = false;
	}
	return $aV;
}
function relay_for(tracker, target) {
	const relay = subscriber_of(() => {
		const connecting = tracker[0].v[3];
		tracker[0].v[2] = true;
		if (connecting) {
			tracker[0].v[4] = true;
		} else {
			wake(target);
		}
		return;
	}, true);
	const $bc = tracker[0].v[7];
	let $bd = null;
	if ($bc[0] === 0) {
		const site = __clone($bc[1]);
		$bd = place_subscriber(relay[0], site);
	} else {
		$bd = undefined;
	}
	$bd;
	return relay;
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
			edges.push([ __clone(dependency[0]), dependency[1](relay_for(tracker, target)) ]);
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
			throw __panic("this style\'s slot key is not one media:condition:property triple (got \"" + key + "\"" + ") \u{2014} every field that reaches a key is fenced against \':\' where it is written, so a key holding another one means a condition token was minted carrying the key\'s own separator; that is the bug, not this read", "std/src/web/style.vl:1305:3");
		})();
	}
	return [ __at(parts, 0, "std/src/web/style.vl:1307:17"), __at(parts, 1, "std/src/web/style.vl:1307:39"), __at(parts, 2, "std/src/web/style.vl:1307:60") ];
}
function family_longhands(property) {
	const $N = property;
	let $O = null;
	if ($N === "padding") {
		$O = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($N === "margin") {
		$O = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($N === "inset") {
		$O = ";top;right;bottom;left;";
	} else if ($N === "flex") {
		$O = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($N === "background") {
		$O = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($N === "border") {
		$O = border_longhands();
	} else {
		$O = "";
	}
	return $O;
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
		const $P = entry;
		const class2 = $P[0];
		const _declaration = $P[1];
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
		const $L = get2(b[0], key);
		let $M = null;
		if ($L[0] === 0) {
			const entry = $L[1];
			const slot = slot_of(key);
			rules = without_covered(rules, slot[0], slot[1], slot[2]);
			insert(rules, key, entry);
			$M = undefined;
		} else {
			$M = undefined;
		}
		$M;
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
		return turn([ 1 ], ($W) => {
			return (() => {
				return handler($W, [ 1 ]);
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
	return __dom_cut_run(row[0], end);
}
function retire_row(self, row, end, disposal) {
	while_leaving(row[0], end, disposal);
	__dom_remove_run(row[0], end);
}
function insert_row(self, row, content, end) {
	host(self).insertBefore(row[0], end);
	host(self).insertBefore(content, end);
}
function hold_rows(self, rows) {
	self[2].v = __clone(rows);
}
function close(self) {
	if (!(is_leaving(self[0]))) {
		for (const view2 of self[1].v) {
			view2[0].remove();
		}
		const $cD = first(self[2].v);
		let $cE = null;
		if ($cD[0] === 0) {
			const first2 = $cD[1];
			$cE = __dom_remove_run(first2[0], self[0]);
		} else {
			$cE = undefined;
		}
		$cE;
		self[0].remove();
	}
	self[1].v = [  ];
	self[2].v = [  ];
}
function close_with(self, disposal) {
	const $cB = first(self[2].v);
	let $cC = null;
	if ($cB[0] === 0) {
		const first2 = $cB[1];
		if (is_leaving(self[0])) {
			disposal();
		} else {
			while_leaving(first2[0], self[0], disposal);
		}
		$cC = undefined;
	} else {
		$cC = disposal();
	}
	$cC;
	close(self);
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
function while_leaving(from, before, disposal) {
	leaving_runs.v.push(__dom_run_nodes(from, before));
	__with_finally(disposal, () => {
		__list_pop(leaving_runs.v);
		return;
	});
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
function settled_steps(steps) {
	let forward = [  ];
	let forward_count = 0;
	let highest = [ 1 ];
	for (const step of steps) {
		const $cP = step;
		let $cQ = null;
		if ($cP[0] === 0) {
			const index = $cP[1];
			const $cR = highest;
			let $cS = null;
			if ($cR[0] === 0) {
				const top = $cR[1];
				$cS = index > top;
			} else {
				$cS = true;
			}
			const rises = $cS;
			if (rises) {
				highest = [ 0, index ];
				forward_count = forward_count + 1;
				forward.push(true);
			} else {
				forward.push(false);
			}
			$cQ = undefined;
		} else {
			forward.push(false);
			$cQ = undefined;
		}
		$cQ;
	}
	let backward = [  ];
	let backward_count = 0;
	let lowest = steps.length;
	let at = steps.length;
	while (at > 0) {
		at = at - 1;
		const $cT = __at(steps, at, "std/src/browser/web/ui.vl:1659:9");
		let $cU = null;
		if ($cT[0] === 0) {
			const index2 = $cT[1];
			if (index2 < lowest) {
				lowest = index2;
				backward_count = backward_count + 1;
				backward.push(true);
			} else {
				backward.push(false);
			}
			$cU = undefined;
		} else {
			backward.push(false);
			$cU = undefined;
		}
		$cU;
	}
	let $cV = null;
	if (forward_count >= backward_count) {
		$cV = forward;
	} else {
		$cV = reverse(backward);
	}
	return $cV;
}
function row_references(steps, rows, settled, anchor) {
	let references = [  ];
	let reference = __clone(anchor);
	let at = steps.length;
	while (at > 0) {
		at = at - 1;
		references.push(__clone(reference));
		let $cY = null;
		if (__at(settled, at, "std/src/browser/web/ui.vl:1751:6")) {
			const $cW = __at(steps, at, "std/src/browser/web/ui.vl:1752:10");
			let $cX = null;
			if ($cW[0] === 0) {
				const index = $cW[1];
				reference = __clone(__at(rows, index, "std/src/browser/web/ui.vl:1754:18")[0]);
				$cX = undefined;
			} else {
				$cX = undefined;
			}
			$cY = $cX;
		}
		$cY;
	}
	return reverse(references);
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
	const $eK = turn([ 1 ], ($eJ) => {
		return comp(body);
	});
	const built = $eK[0];
	const root = $eK[1];
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
	return child2(attr(view("option"), "value", value, $bH, $bI, "src/playground_page.vl:320:2"), label, $bH, $bI, "src/playground_page.vl:320:2");
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
		$cr = child2(styled(view("span"), diag_error), "error", $co, $cp, "src/playground_page.vl:409:14");
	} else {
		$cr = child2(styled(view("span"), diag_warning), "warning", $co, $cp, "src/playground_page.vl:410:8");
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
	return child2(styled(view("div"), diag_trace), text, $cs, $ct, "src/playground_page.vl:422:2");
}
function diagnostic_row(row, $cm, $cn) {
	const head = child(child(child(view("div"), severity_tag(row, $cm, $cn), $cm, $cn, "src/playground_page.vl:429:13"), child2(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " ", $cm, $cn, "src/playground_page.vl:431:3"), $cm, $cn, "src/playground_page.vl:429:13"), child2(view("span"), row[5], $cm, $cn, "src/playground_page.vl:432:3"), $cm, $cn, "src/playground_page.vl:429:13");
	let lines = [ head ];
	for (const hop of row[7]) {
		lines.push(trace_row(hop, $cm, $cn));
	}
	if (row[6] !== "") {
		lines.push(child2(styled(view("div"), diag_note), "  note: " + row[6], $cm, $cn, "src/playground_page.vl:439:14"));
	}
	const body = child5(view("div"), lines, $cm, $cn, "src/playground_page.vl:441:13");
	const $cv = row[1];
	let $cw = null;
	if ($cv === "error") {
		$cw = child(styled(view("div"), diag_row_error), body, $cm, $cn, "src/playground_page.vl:443:14");
	} else {
		$cw = child(styled(view("div"), diag_row_warning), body, $cm, $cn, "src/playground_page.vl:444:8");
	}
	return $cw;
}
function console_row(row, $dO, $dP) {
	const $dQ = row[1];
	let $dR = null;
	if ($dQ === "error") {
		$dR = child2(styled(view("div"), console_error), row[2], $dO, $dP, "src/playground_page.vl:450:14");
	} else {
		$dR = child2(styled(view("div"), console_line), row[2], $dO, $dP, "src/playground_page.vl:451:8");
	}
	return $dR;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, can_prelude2, share_label2, mode2, modified_from2, confirm_target2, run2, format2, share2, confirm_replace2, cancel_replace2, $G, $H) {
	return child(child(styled(view("div"), add(add(shell, app_fill), code_palette)), child(child(child(child(child(child(child(child(child(child(child(child(styled(view("header"), app_bar), child(child(attr(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $G, $H, "src/playground_page.vl:476:4"), attr(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $G, $H, "src/playground_page.vl:477:5"), $G, $H, "src/playground_page.vl:476:4"), child2(view("span"), "VILAN", $G, $H, "src/playground_page.vl:478:5"), $G, $H, "src/playground_page.vl:476:4"), $G, $H, "src/playground_page.vl:475:3"), child2(styled(view("h1"), page_title), "Playground", $G, $H, "src/playground_page.vl:480:4"), $G, $H, "src/playground_page.vl:475:3"), styled(view("div"), rail_divider), $G, $H, "src/playground_page.vl:475:3"), child3(on(styled(view("button"), primary_button), "click", ($U, $V) => {
		return run2();
	}), derive(__clone(mode2), (current, $X, $Y, $Z) => {
		const $aa = current;
		let $ab = null;
		if ($aa === "node") {
			$ab = "Check";
		} else {
			$ab = "Run";
		}
		return $ab;
	}, "src/playground_page.vl:483:11"), $G, $H, "src/playground_page.vl:482:4"), $G, $H, "src/playground_page.vl:475:3"), child(child(show(attr(attr(styled(view("select"), select_box), "id", "mode", $G, $H, "src/playground_page.vl:488:4"), "aria-label", "Compile mode", $G, $H, "src/playground_page.vl:488:4"), __clone(can_platform2), $G, $H, "src/playground_page.vl:488:71"), template_option("browser", "Browser: compile and run", $G, $H), $G, $H, "src/playground_page.vl:488:4"), template_option("node", "Server: check the process leg", $G, $H), $G, $H, "src/playground_page.vl:488:4"), $G, $H, "src/playground_page.vl:475:3"), child(child(child(show(attr(attr(styled(view("select"), select_box), "id", "prelude", $G, $H, "src/playground_page.vl:492:4"), "aria-label", "Ambient scope", $G, $H, "src/playground_page.vl:492:4"), __clone(can_prelude2), $G, $H, "src/playground_page.vl:492:75"), template_option("on", "Prelude: on", $G, $H), $G, $H, "src/playground_page.vl:492:4"), template_option("web", "Prelude: web", $G, $H), $G, $H, "src/playground_page.vl:492:4"), template_option("off", "Prelude: off", $G, $H), $G, $H, "src/playground_page.vl:492:4"), $G, $H, "src/playground_page.vl:475:3"), child2(show(on(styled(view("button"), ghost_button), "click", ($bJ, $bK) => {
		return format2();
	}), __clone(can_format2), $G, $H, "src/playground_page.vl:497:57"), "Format", $G, $H, "src/playground_page.vl:497:4"), $G, $H, "src/playground_page.vl:475:3"), child4(on(styled(view("button"), ghost_button), "click", ($bL, $bM) => {
		return share2();
	}), __clone(share_label2), $G, $H, "src/playground_page.vl:498:4"), $G, $H, "src/playground_page.vl:475:3"), child4(attr(styled(view("p"), status_line), "role", "status", $G, $H, "src/playground_page.vl:499:4"), __clone(status2), $G, $H, "src/playground_page.vl:499:4"), $G, $H, "src/playground_page.vl:475:3"), attr(attr(styled(view("select"), version_select), "id", "version", $G, $H, "src/playground_page.vl:500:4"), "aria-label", "Compiler version", $G, $H, "src/playground_page.vl:500:4"), $G, $H, "src/playground_page.vl:475:3"), styled(view("div"), rail_divider), $G, $H, "src/playground_page.vl:475:3"), child2(attr(styled(view("a"), nav_link), "href", "/docs/", $G, $H, "src/playground_page.vl:502:4"), "Docs", $G, $H, "src/playground_page.vl:502:4"), $G, $H, "src/playground_page.vl:475:3"), $G, $H, "src/playground_page.vl:474:2"), child(child(child(child(styled(view("main"), quad_grid), child(child(child(styled(view("div"), panel), child(child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Program", $G, $H, "src/playground_page.vl:507:6"), $G, $H, "src/playground_page.vl:506:5"), child(child(child(child(child(attr(attr(styled(view("select"), select_box), "id", "template", $G, $H, "src/playground_page.vl:508:6"), "aria-label", "Load an example", $G, $H, "src/playground_page.vl:508:6"), child3(attr(attr(attr(view("option"), "disabled", "true", $G, $H, "src/playground_page.vl:509:7"), "hidden", "true", $G, $H, "src/playground_page.vl:509:7"), "value", "", $G, $H, "src/playground_page.vl:509:7"), derive(__clone(modified_from2), (name, $bP, $bQ, $bR) => {
		const $bS = name;
		let $bT = null;
		if ($bS === "") {
			$bT = "Examples";
		} else {
			$bT = "Modified \u{2014} " + template_title(name);
		}
		return $bT;
	}, "src/playground_page.vl:510:23"), $G, $H, "src/playground_page.vl:509:7"), $G, $H, "src/playground_page.vl:508:6"), template_option("counter", "Counter: reactive state", $G, $H), $G, $H, "src/playground_page.vl:508:6"), template_option("hello", "Hello: mount and print", $G, $H), $G, $H, "src/playground_page.vl:508:6"), template_option("styles", "Styles: compile-time CSS", $G, $H), $G, $H, "src/playground_page.vl:508:6"), show(template_option("server", "Server: typed HTTP, checked", $G, $H), __clone(can_platform2), $G, $H, "src/playground_page.vl:518:65"), $G, $H, "src/playground_page.vl:508:6"), $G, $H, "src/playground_page.vl:506:5"), $G, $H, "src/playground_page.vl:505:4"), child(show2(attr(view("div"), "role", "alert", $G, $H, "src/playground_page.vl:521:5"), derive(__clone(confirm_target2), (name, $bW, $bX, $bY) => {
		return name !== "";
	}, "src/playground_page.vl:521:45"), $G, $H, "src/playground_page.vl:521:25"), child(child(child(styled(view("div"), confirm_bar), child3(styled(view("p"), confirm_question), derive(__clone(confirm_target2), (name, $cb, $cc, $cd) => {
		return "Replace the current program with " + template_title(name) + "? The edits are not kept.";
	}, "src/playground_page.vl:525:10"), $G, $H, "src/playground_page.vl:523:7"), $G, $H, "src/playground_page.vl:522:6"), child2(on(styled(view("button"), ghost_button), "click", ($ce, $cf) => {
		return cancel_replace2();
	}), "Keep editing", $G, $H, "src/playground_page.vl:527:7"), $G, $H, "src/playground_page.vl:522:6"), child2(on(styled(view("button"), primary_button), "click", ($cg, $ch) => {
		return confirm_replace2();
	}), "Replace", $G, $H, "src/playground_page.vl:530:7"), $G, $H, "src/playground_page.vl:522:6"), $G, $H, "src/playground_page.vl:521:5"), $G, $H, "src/playground_page.vl:505:4"), attr(attr(styled(view("div"), editor_host), "id", "editor", $G, $H, "src/playground_page.vl:535:5"), "aria-label", "Program editor", $G, $H, "src/playground_page.vl:535:5"), $G, $H, "src/playground_page.vl:505:4"), $G, $H, "src/playground_page.vl:504:3"), child(child(styled(view("div"), panel), child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Result", $G, $H, "src/playground_page.vl:539:6"), $G, $H, "src/playground_page.vl:538:5"), $G, $H, "src/playground_page.vl:537:4"), attr(attr(styled(view("div"), runner_host), "id", "runner", $G, $H, "src/playground_page.vl:541:5"), "aria-label", "Program result", $G, $H, "src/playground_page.vl:541:5"), $G, $H, "src/playground_page.vl:537:4"), $G, $H, "src/playground_page.vl:504:3"), child(child(styled(view("div"), panel), child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Diagnostics", $G, $H, "src/playground_page.vl:545:6"), $G, $H, "src/playground_page.vl:544:5"), $G, $H, "src/playground_page.vl:543:4"), child6(child(styled(view("pre"), report_well), child2(show3(styled(view("div"), quiet_row), derive(__clone(diagnostics2), (rows, $ci, $cj, $ck) => {
		return rows.length === 0;
	}, "src/playground_page.vl:548:48"), $G, $H, "src/playground_page.vl:548:31"), "Nothing to report.", $G, $H, "src/playground_page.vl:548:6"), $G, $H, "src/playground_page.vl:547:5"), each_by(__clone(diagnostics2), (row) => {
		return row[0];
	}, (row, $cl) => {
		return diagnostic_row(get(row), $G, $cl);
	}), $G, $H, "src/playground_page.vl:547:5"), $G, $H, "src/playground_page.vl:543:4"), $G, $H, "src/playground_page.vl:504:3"), child(child(styled(view("div"), panel), child(styled(view("div"), panel_head), child2(styled(view("p"), panel_title), "Console", $G, $H, "src/playground_page.vl:556:6"), $G, $H, "src/playground_page.vl:555:5"), $G, $H, "src/playground_page.vl:554:4"), child7(child(styled(view("pre"), report_well), child2(show4(styled(view("div"), quiet_row), derive(__clone(console_lines2), (rows, $dK, $dL, $dM) => {
		return rows.length === 0;
	}, "src/playground_page.vl:559:50"), $G, $H, "src/playground_page.vl:559:31"), "Program output lands here.", $G, $H, "src/playground_page.vl:559:6"), $G, $H, "src/playground_page.vl:558:5"), each_by(__clone(console_lines2), (row) => {
		return row[0];
	}, (row, $dN) => {
		return console_row(get(row), $G, $dN);
	}), $G, $H, "src/playground_page.vl:558:5"), $G, $H, "src/playground_page.vl:554:4"), $G, $H, "src/playground_page.vl:504:3"), $G, $H, "src/playground_page.vl:474:2");
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
function values(self) {
	return __nmap_values(self[0]);
}
function attr(self, name, value, $Q, $R, caller) {
	apply(value, self, name, $Q, $R, caller);
	return __clone(self);
}
function child(self, content, $S, $T, caller) {
	place(content, self, $S, $T, caller);
	return __clone(self);
}
function child2(self, content, $S, $T, caller) {
	place2(content, self, $S, $T, caller);
	return __clone(self);
}
function turn(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[5].v = true;
	return result;
}
function derive(self, transform, caller) {
	return [ self, transform, caller ];
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
	const $aB = self;
	return $aB[0] === 1;
}
function run_body(runs, body) {
	const run2 = renew(runs);
	const $aK = nursery(run2);
	let $aL = null;
	if ($aK[0] === 0) {
		const nursery2 = $aK[1];
		$aL = (($aM) => {
			return (($aN) => {
				return body($aM, $aN);
			})(nursery2);
		})(run2);
	} else {
		$aL = (() => {
			throw __panic("a renewed run carries its nursery", "std/src/reactive.vl:1405:11");
		})();
	}
	return $aL;
}
function run_once(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = run_body(runs, ($at, $au) => {
		return (($av) => {
			return body($at, $av, $au);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function run_tracked(runs, tracker, body) {
	let value = run_once(runs, tracker, ($ao, $ap, $aq) => {
		return body($ao, $ap, $aq);
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
	const site = __clone(self[2]);
	const upstream = start(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker([ 0, site ]);
	return [ () => {
		const value = pull();
		return run_tracked(runs, tracker, ($al, $am, $an) => {
			return transform(value, $al, $am, $an);
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
function follow(flow, observer, $aj, $ak, caller) {
	take(get_owner($ak), sub(flow, observer, caller), $aj);
}
function place_text_flow(flow, parent, $ae, $af, caller) {
	const node = document.createTextNode("");
	parent[0].appendChild(node);
	defer(get_owner($af), () => {
		if (!(is_leaving(node))) {
			node.remove();
		}
		return;
	});
	follow(flow, (value, $ai) => {
		node.textContent = value;
		return;
	}, $ae, $af, caller);
}
function place4(self, parent, $ac, $ad, caller) {
	place_text_flow(self, parent, $ac, $ad, caller);
}
function child3(self, content, $S, $T, caller) {
	place4(content, self, $S, $T, caller);
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
function follow2(flow, observer, $aj, $ak, caller) {
	take(get_owner($ak), sub2(flow, observer, caller), $aj);
}
function show(self, condition, $bC, $bD, caller) {
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
	}, $bC, $bD, caller);
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
function follow3(flow, observer, $aj, $ak, caller) {
	take(get_owner($ak), sub3(flow, observer, caller), $aj);
}
function place_text_flow2(flow, parent, $ae, $af, caller) {
	const node = document.createTextNode("");
	parent[0].appendChild(node);
	defer(get_owner($af), () => {
		if (!(is_leaving(node))) {
			node.remove();
		}
		return;
	});
	follow3(flow, (value, $ai) => {
		node.textContent = value;
		return;
	}, $ae, $af, caller);
}
function place5(self, parent, $ac, $ad, caller) {
	place_text_flow2(self, parent, $ac, $ad, caller);
}
function child4(self, content, $S, $T, caller) {
	place5(content, self, $S, $T, caller);
	return __clone(self);
}
function run_body2(runs, body) {
	const run2 = renew(runs);
	const $bZ = nursery(run2);
	let $ca = null;
	if ($bZ[0] === 0) {
		const nursery2 = $bZ[1];
		$ca = (($aM) => {
			return (($aN) => {
				return body($aM, $aN);
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
	const value = run_body2(runs, ($at, $au) => {
		return (($av) => {
			return body($at, $av, $au);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function run_tracked2(runs, tracker, body) {
	let value = run_once2(runs, tracker, ($ao, $ap, $aq) => {
		return body($ao, $ap, $aq);
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
	const site = __clone(self[2]);
	const upstream = start(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker([ 0, site ]);
	return [ () => {
		const value = pull();
		return run_tracked2(runs, tracker, ($al, $am, $an) => {
			return transform(value, $al, $am, $an);
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
function follow4(flow, observer, $aj, $ak, caller) {
	take(get_owner($ak), sub4(flow, observer, caller), $aj);
}
function show2(self, condition, $bC, $bD, caller) {
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
	}, $bC, $bD, caller);
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
	const site = __clone(self[2]);
	const upstream = start4(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker([ 0, site ]);
	return [ () => {
		const value = pull();
		return run_tracked2(runs, tracker, ($al, $am, $an) => {
			return transform(value, $al, $am, $an);
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
function follow5(flow, observer, $aj, $ak, caller) {
	take(get_owner($ak), sub5(flow, observer, caller), $aj);
}
function show3(self, condition, $bC, $bD, caller) {
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
	}, $bC, $bD, caller);
	return __clone(self);
}
function child5(self, content, $S, $T, caller) {
	place3(content, self, $S, $T, caller);
	return __clone(self);
}
function each_by(source, key, render) {
	return [ source, key, render ];
}
function first(self) {
	return __list_get(self, 0);
}
function held_span(held, at, count) {
	if (at === 0 && count === held.v.length) {
		const run2 = __clone(held.v);
		return run2;
	}
	let span = [  ];
	let index = at;
	while (index < at + count) {
		span.push(__clone(__at(held.v, index, "std/src/browser/web/ui.vl:1694:13")));
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
	let first2 = new Map();
	let next_same = [  ];
	for (const _ of old_keys) {
		next_same.push([ 1 ]);
	}
	let build = held;
	while (build > 0) {
		build = build - 1;
		const canonical = hash2(__at(old_keys, build, "std/src/reactive.vl:3940:19"));
		__at_put(next_same, build, __map_get(first2, canonical), "std/src/reactive.vl:3941:3");
		first2.set(canonical, build);
	}
	let steps = [  ];
	for (const item of items) {
		const item_key = key_of(item);
		const canonical2 = hash2(item_key);
		let head = __map_get(first2, canonical2);
		let advancing = true;
		while (advancing) {
			const $cG = head;
			let $cH = null;
			if ($cG[0] === 0) {
				const at = $cG[1];
				if (__at(claimed, at, "std/src/reactive.vl:3957:9")) {
					head = __clone(__at(next_same, at, "std/src/reactive.vl:3958:14"));
				} else {
					advancing = false;
				}
				$cH = undefined;
			} else {
				$cH = advancing = false;
			}
			$cH;
		}
		const $cI = head;
		let $cJ = null;
		if ($cI[0] === 0) {
			const at2 = $cI[1];
			$cJ = first2.set(canonical2, at2);
		} else {
			$cJ = first2.delete(canonical2);
		}
		$cJ;
		let found = [ 1 ];
		let walk = head;
		let walking = true;
		while (walking) {
			const $cK = walk;
			let $cL = null;
			if ($cK[0] === 0) {
				const at3 = $cK[1];
				if (!(__at(claimed, at3, "std/src/reactive.vl:3976:10")) && __at(old_keys, at3, "std/src/reactive.vl:3976:25") === item_key) {
					found = [ 0, at3 ];
					walking = false;
				} else {
					walk = __clone(__at(next_same, at3, "std/src/reactive.vl:3983:14"));
				}
				$cL = undefined;
			} else {
				$cL = walking = false;
			}
			$cL;
		}
		let step = [ 2 ];
		const $cM = found;
		if ($cM[0] === 0) {
			__at_put(claimed, $cM[1], true, "std/src/reactive.vl:3991:4");
			let $cN = null;
			if (same(__at(old_items, $cM[1], "std/src/reactive.vl:3992:19"), item)) {
				$cN = [ 0, $cM[1] ];
			} else {
				$cN = [ 1, $cM[1] ];
			}
			step = $cN;
		}
		steps.push(step);
	}
	let removed = [  ];
	let index = 0;
	while (index < held) {
		if (!(__at(claimed, index, "std/src/reactive.vl:3999:7"))) {
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
function open_row_before(self, content, end, $dr, $ds) {
	const marker = document.createTextNode("");
	host(self).insertBefore(marker, end);
	const staging = document.createDocumentFragment();
	place(content, [ __clone(staging) ], $dr, $ds, "std/src/browser/web/ui.vl:801:11");
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
	const $dx = delta_cursor(self);
	let $dy = null;
	if ($dx[0] === 0) {
		const cursor = $dx[1];
		$dy = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return delta_since(self, cursor);
		}, () => {
			return drop_delta_cursor(self, cursor);
		} ];
	} else {
		$dy = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return [ [ 2, get(self) ] ];
		}, () => {
			return;
		} ];
	}
	return $dy;
}
function live_ops(ops) {
	let last2 = [ 1 ];
	let index = 0;
	for (const op of ops) {
		const $dz = op;
		let $dA = null;
		if ($dz[0] === 2) {
			const _items = $dz[1];
			last2 = [ 0, index ];
			$dA = undefined;
		} else {
			$dA = undefined;
		}
		$dA;
		index = index + 1;
	}
	const $dB = last2;
	let $dC = null;
	if ($dB[0] === 0 && $dB[1] > 0) {
		$dC = $dB[1];
	} else {
		return __clone(ops);
	}
	const from = $dC;
	let live = [  ];
	index = from;
	while (index < ops.length) {
		live.push(__clone(__at(ops, index, "std/src/browser/web/ui.vl:1726:13")));
		index = index + 1;
	}
	return live;
}
function place_each_by(parent, source, key, render, $cz, $cA, caller) {
	const region = open(parent);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_cells = __shared_new([  ]);
	const row_rows = region[2];
	const row_owners = __shared_new([  ]);
	defer(get_owner($cA), () => {
		return close_with(region, () => {
			for (const owner of row_owners.v) {
				dispose2(owner);
			}
			return;
		});
	});
	const reconcile_span = (at, count, list) => {
		const whole = at === 0 && count === row_rows.v.length;
		const previous_cells = held_span(row_cells, at, count);
		const previous_rows = held_span(row_rows, at, count);
		const previous_owners = held_span(row_owners, at, count);
		let $cF = null;
		if (at + count < row_rows.v.length) {
			$cF = __at(row_rows.v, at + count, "std/src/browser/web/ui.vl:2139:4")[0];
		} else {
			$cF = region[0];
		}
		const boundary = __clone($cF);
		const same = (_before, _after) => {
			return true;
		};
		let $cO = null;
		if (whole) {
			$cO = reconcile(__clone(row_keys.v), __clone(row_items.v), list, key, same);
		} else {
			$cO = reconcile(held_span(row_keys, at, count), held_span(row_items, at, count), list, key, same);
		}
		const plan = $cO;
		const settled = settled_steps(plan[0]);
		const references = row_references(plan[0], previous_rows, settled, boundary);
		let staying = [  ];
		let retiring = [  ];
		let fill = 0;
		while (fill < previous_rows.length) {
			staying.push(false);
			retiring.push(false);
			fill = fill + 1;
		}
		for (const gone of plan[1]) {
			__at_put(retiring, gone, true, "std/src/browser/web/ui.vl:2173:4");
		}
		let settled_at = 0;
		for (const step of plan[0]) {
			let $db = null;
			if (__at(settled, settled_at, "std/src/browser/web/ui.vl:2177:7")) {
				const $cZ = step;
				let $da = null;
				if ($cZ[0] === 0) {
					const index = $cZ[1];
					__at_put(staying, index, true, "std/src/browser/web/ui.vl:2180:7");
					$da = undefined;
				} else {
					$da = undefined;
				}
				$db = $da;
			}
			$db;
			settled_at = settled_at + 1;
		}
		let cut = [  ];
		let index2 = 0;
		for (const row of previous_rows) {
			let $dd = null;
			if (__at(staying, index2, "std/src/browser/web/ui.vl:2192:7")) {
				cut.push([ 1 ]);
			} else {
				let $dc = null;
				if (index2 + 1 < previous_rows.length) {
					$dc = __at(previous_rows, index2 + 1, "std/src/browser/web/ui.vl:2196:6")[0];
				} else {
					$dc = boundary;
				}
				const end = __clone($dc);
				if (__at(retiring, index2, "std/src/browser/web/ui.vl:2200:8")) {
					const owner = __clone(__at(previous_owners, index2, "std/src/browser/web/ui.vl:2204:18"));
					retire_row(region, row, end, () => {
						return dispose2(owner);
					});
					cut.push([ 1 ]);
				} else {
					cut.push([ 0, cut_row(region, row, end) ]);
				}
				$dd = undefined;
			}
			$dd;
			index2 = index2 + 1;
		}
		let next_cells = [  ];
		let next_rows = [  ];
		let next_owners = [  ];
		let position = 0;
		for (const step2 of plan[0]) {
			const item = __clone(__at(list, position, "std/src/browser/web/ui.vl:2218:15"));
			const reference = __clone(__at(references, position, "std/src/browser/web/ui.vl:2219:20"));
			const $de = step2;
			let $df = null;
			if ($de[0] === 0) {
				const kept = $de[1];
				const cell = __clone(__at(previous_cells, kept, "std/src/browser/web/ui.vl:2222:17"));
				set3(cell, item, $cz, "std/src/browser/web/ui.vl:2223:11");
				next_cells.push(cell);
				const $dm = __at(cut, kept, "std/src/browser/web/ui.vl:2225:12");
				let $dn = null;
				if ($dm[0] === 0) {
					const content = __clone($dm[1]);
					insert_row(region, __at(previous_rows, kept, "std/src/browser/web/ui.vl:2227:26"), content, reference);
					$dn = undefined;
				} else {
					$dn = undefined;
				}
				$dn;
				next_rows.push(__clone(__at(previous_rows, kept, "std/src/browser/web/ui.vl:2231:21")));
				next_owners.push(__clone(__at(previous_owners, kept, "std/src/browser/web/ui.vl:2232:23")));
				$df = undefined;
			} else if ($de[0] === 1) {
				const kept2 = $de[1];
				const cell2 = __clone(__at(previous_cells, kept2, "std/src/browser/web/ui.vl:2238:17"));
				set3(cell2, item, $cz, "std/src/browser/web/ui.vl:2239:11");
				next_cells.push(cell2);
				const $do = __at(cut, kept2, "std/src/browser/web/ui.vl:2241:12");
				let $dp = null;
				if ($do[0] === 0) {
					const content2 = __clone($do[1]);
					insert_row(region, __at(previous_rows, kept2, "std/src/browser/web/ui.vl:2243:26"), content2, reference);
					$dp = undefined;
				} else {
					$dp = undefined;
				}
				$dp;
				next_rows.push(__clone(__at(previous_rows, kept2, "std/src/browser/web/ui.vl:2247:21")));
				next_owners.push(__clone(__at(previous_owners, kept2, "std/src/browser/web/ui.vl:2248:23")));
				$df = undefined;
			} else {
				const cell3 = new4(item, "std/src/browser/web/ui.vl:2251:44");
				const owner2 = new3();
				next_cells.push(__clone(cell3));
				next_rows.push(run_with_owner(owner2, ($dq) => {
					return open_row_before(region, render(cell3, $dq), reference, $cz, $dq);
				}));
				next_owners.push(owner2);
				$df = undefined;
			}
			$df;
			position = position + 1;
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		let $dt = null;
		if (whole) {
			hold_rows(region, next_rows);
			row_keys.v = next_keys;
			row_items.v = __clone(list);
			row_cells.v = next_cells;
			row_owners.v = next_owners;
		} else {
			let taken = 0;
			while (taken < count) {
				__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2279:33");
				__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2280:37");
				__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2281:35");
				__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2282:33");
				__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2283:35");
				taken = taken + 1;
			}
			let offset = 0;
			while (offset < next_rows.length) {
				__insert_at(row_rows.v, at + offset, __clone(__at(next_rows, offset, "std/src/browser/web/ui.vl:2288:42")), "std/src/browser/web/ui.vl:2288:22");
				__insert_at(row_owners.v, at + offset, __clone(__at(next_owners, offset, "std/src/browser/web/ui.vl:2289:44")), "std/src/browser/web/ui.vl:2289:24");
				__insert_at(row_cells.v, at + offset, __clone(__at(next_cells, offset, "std/src/browser/web/ui.vl:2290:43")), "std/src/browser/web/ui.vl:2290:23");
				__insert_at(row_keys.v, at + offset, __clone(__at(next_keys, offset, "std/src/browser/web/ui.vl:2291:42")), "std/src/browser/web/ui.vl:2291:22");
				__insert_at(row_items.v, at + offset, __clone(__at(list, offset, "std/src/browser/web/ui.vl:2292:43")), "std/src/browser/web/ui.vl:2292:23");
				offset = offset + 1;
			}
			$dt = undefined;
		}
		return $dt;
	};
	const reconcile_pass = (list) => {
		return reconcile_span(0, row_rows.v.length, list);
	};
	const splice_rows = (at, removed, inserted) => {
		let taken = 0;
		while (taken < removed) {
			let $du = null;
			if (at + 1 < row_rows.v.length) {
				$du = __at(row_rows.v, at + 1, "std/src/browser/web/ui.vl:2307:5")[0];
			} else {
				$du = region[0];
			}
			const end = __clone($du);
			const going = __clone(__at(row_rows.v, at, "std/src/browser/web/ui.vl:2311:16"));
			const owner = __clone(__at(row_owners.v, at, "std/src/browser/web/ui.vl:2312:16"));
			retire_row(region, going, end, () => {
				return dispose2(owner);
			});
			__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2314:32");
			__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2315:36");
			__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2316:34");
			__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2317:32");
			__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2318:34");
			taken = taken + 1;
		}
		let $dv = null;
		if (at < row_rows.v.length) {
			$dv = __at(row_rows.v, at, "std/src/browser/web/ui.vl:2322:4")[0];
		} else {
			$dv = region[0];
		}
		const reference = __clone($dv);
		let offset = 0;
		for (const item of inserted) {
			const cell = new4(__clone(item), "std/src/browser/web/ui.vl:2328:42");
			const owner2 = new3();
			const row = run_with_owner(owner2, ($dw) => {
				return open_row_before(region, render(cell, $dw), reference, $cz, $dw);
			});
			__insert_at(row_rows.v, at + offset, row, "std/src/browser/web/ui.vl:2331:21");
			__insert_at(row_owners.v, at + offset, owner2, "std/src/browser/web/ui.vl:2332:23");
			__insert_at(row_cells.v, at + offset, __clone(cell), "std/src/browser/web/ui.vl:2333:22");
			__insert_at(row_keys.v, at + offset, key(item), "std/src/browser/web/ui.vl:2334:21");
			__insert_at(row_items.v, at + offset, __clone(item), "std/src/browser/web/ui.vl:2335:22");
			offset = offset + 1;
		}
		return;
	};
	const instance = open_rows(source);
	const drain2 = instance[2];
	const run2 = subscriber_of(() => {
		for (const op of live_ops(drain2())) {
			const $dD = op;
			let $dE = null;
			if ($dD[0] === 0) {
				const at = $dD[1];
				const removed = $dD[2];
				const inserted = $dD[3];
				if (removed.length === 0 || inserted.length === 0) {
					splice_rows(at, removed.length, inserted);
				} else {
					reconcile_span(at, removed.length, inserted);
				}
				$dE = undefined;
			} else if ($dD[0] === 1) {
				const at2 = $dD[1];
				const _was = $dD[2];
				const value = $dD[3];
				const $dF = __list_get(row_keys.v, at2);
				let $dG = null;
				if ($dF[0] === 0) {
					const held = $dF[1];
					$dG = key(value) === held;
				} else {
					$dG = false;
				}
				const same_key = $dG;
				let $dJ = null;
				if (same_key) {
					const $dH = __list_get(row_cells.v, at2);
					let $dI = null;
					if ($dH[0] === 0) {
						const cell = $dH[1];
						__at_put(row_items.v, at2, __clone(value), "std/src/browser/web/ui.vl:2369:9");
						set3(cell, value, $cz, "std/src/browser/web/ui.vl:2370:14");
						$dI = undefined;
					} else {
						$dI = undefined;
					}
					$dJ = $dI;
				} else {
					splice_rows(at2, 1, [ __clone(value) ]);
				}
				$dE = $dJ;
			} else if ($dD[0] === 2) {
				const items = $dD[1];
				$dE = reconcile_pass(items);
			} else {
				const from = $dD[1];
				const count = $dD[2];
				const to = $dD[3];
				let moved = __clone(row_items.v);
				let lifted = [  ];
				let taken = 0;
				while (taken < count) {
					lifted.push(__remove_at(moved, from, "std/src/browser/web/ui.vl:2388:25"));
					taken = taken + 1;
				}
				let offset = 0;
				for (const item of lifted) {
					__insert_at(moved, to + offset, __clone(item), "std/src/browser/web/ui.vl:2393:13");
					offset = offset + 1;
				}
				reconcile_pass(moved);
				$dE = undefined;
			}
			$dE;
		}
		return;
	}, false);
	place_subscriber(run2[0], caller);
	const handle = instance[1](run2);
	also_releasing(handle, instance[3]);
	take(get_owner($cA), handle, $cz);
	reconcile_pass(instance[0]());
}
function place6(self, parent, $cx, $cy, caller) {
	place_each_by(parent, __clone(self[0]), self[1], self[2], $cx, $cy, caller);
}
function child6(self, content, $S, $T, caller) {
	place6(content, self, $S, $T, caller);
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
	const site = __clone(self[2]);
	const upstream = start6(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker([ 0, site ]);
	return [ () => {
		const value = pull();
		return run_tracked2(runs, tracker, ($al, $am, $an) => {
			return transform(value, $al, $am, $an);
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
function follow6(flow, observer, $aj, $ak, caller) {
	take(get_owner($ak), sub6(flow, observer, caller), $aj);
}
function show4(self, condition, $bC, $bD, caller) {
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
	}, $bC, $bD, caller);
	return __clone(self);
}
function open_rows2(self) {
	const $ew = delta_cursor(self);
	let $ex = null;
	if ($ew[0] === 0) {
		const cursor = $ew[1];
		$ex = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return delta_since(self, cursor);
		}, () => {
			return drop_delta_cursor(self, cursor);
		} ];
	} else {
		$ex = [ () => {
			return get(self);
		}, (subscriber) => {
			return on_settle2(self, subscriber);
		}, () => {
			return [ [ 2, get(self) ] ];
		}, () => {
			return;
		} ];
	}
	return $ex;
}
function place_each_by2(parent, source, key, render, $cz, $cA, caller) {
	const region = open(parent);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_cells = __shared_new([  ]);
	const row_rows = region[2];
	const row_owners = __shared_new([  ]);
	defer(get_owner($cA), () => {
		return close_with(region, () => {
			for (const owner of row_owners.v) {
				dispose2(owner);
			}
			return;
		});
	});
	const reconcile_span = (at, count, list) => {
		const whole = at === 0 && count === row_rows.v.length;
		const previous_cells = held_span(row_cells, at, count);
		const previous_rows = held_span(row_rows, at, count);
		const previous_owners = held_span(row_owners, at, count);
		let $dS = null;
		if (at + count < row_rows.v.length) {
			$dS = __at(row_rows.v, at + count, "std/src/browser/web/ui.vl:2139:4")[0];
		} else {
			$dS = region[0];
		}
		const boundary = __clone($dS);
		const same = (_before, _after) => {
			return true;
		};
		let $eb = null;
		if (whole) {
			$eb = reconcile(__clone(row_keys.v), __clone(row_items.v), list, key, same);
		} else {
			$eb = reconcile(held_span(row_keys, at, count), held_span(row_items, at, count), list, key, same);
		}
		const plan = $eb;
		const settled = settled_steps(plan[0]);
		const references = row_references(plan[0], previous_rows, settled, boundary);
		let staying = [  ];
		let retiring = [  ];
		let fill = 0;
		while (fill < previous_rows.length) {
			staying.push(false);
			retiring.push(false);
			fill = fill + 1;
		}
		for (const gone of plan[1]) {
			__at_put(retiring, gone, true, "std/src/browser/web/ui.vl:2173:4");
		}
		let settled_at = 0;
		for (const step of plan[0]) {
			let $ee = null;
			if (__at(settled, settled_at, "std/src/browser/web/ui.vl:2177:7")) {
				const $ec = step;
				let $ed = null;
				if ($ec[0] === 0) {
					const index = $ec[1];
					__at_put(staying, index, true, "std/src/browser/web/ui.vl:2180:7");
					$ed = undefined;
				} else {
					$ed = undefined;
				}
				$ee = $ed;
			}
			$ee;
			settled_at = settled_at + 1;
		}
		let cut = [  ];
		let index2 = 0;
		for (const row of previous_rows) {
			let $eg = null;
			if (__at(staying, index2, "std/src/browser/web/ui.vl:2192:7")) {
				cut.push([ 1 ]);
			} else {
				let $ef = null;
				if (index2 + 1 < previous_rows.length) {
					$ef = __at(previous_rows, index2 + 1, "std/src/browser/web/ui.vl:2196:6")[0];
				} else {
					$ef = boundary;
				}
				const end = __clone($ef);
				if (__at(retiring, index2, "std/src/browser/web/ui.vl:2200:8")) {
					const owner = __clone(__at(previous_owners, index2, "std/src/browser/web/ui.vl:2204:18"));
					retire_row(region, row, end, () => {
						return dispose2(owner);
					});
					cut.push([ 1 ]);
				} else {
					cut.push([ 0, cut_row(region, row, end) ]);
				}
				$eg = undefined;
			}
			$eg;
			index2 = index2 + 1;
		}
		let next_cells = [  ];
		let next_rows = [  ];
		let next_owners = [  ];
		let position = 0;
		for (const step2 of plan[0]) {
			const item = __clone(__at(list, position, "std/src/browser/web/ui.vl:2218:15"));
			const reference = __clone(__at(references, position, "std/src/browser/web/ui.vl:2219:20"));
			const $eh = step2;
			let $ei = null;
			if ($eh[0] === 0) {
				const kept = $eh[1];
				const cell = __clone(__at(previous_cells, kept, "std/src/browser/web/ui.vl:2222:17"));
				set3(cell, item, $cz, "std/src/browser/web/ui.vl:2223:11");
				next_cells.push(cell);
				const $ep = __at(cut, kept, "std/src/browser/web/ui.vl:2225:12");
				let $eq = null;
				if ($ep[0] === 0) {
					const content = __clone($ep[1]);
					insert_row(region, __at(previous_rows, kept, "std/src/browser/web/ui.vl:2227:26"), content, reference);
					$eq = undefined;
				} else {
					$eq = undefined;
				}
				$eq;
				next_rows.push(__clone(__at(previous_rows, kept, "std/src/browser/web/ui.vl:2231:21")));
				next_owners.push(__clone(__at(previous_owners, kept, "std/src/browser/web/ui.vl:2232:23")));
				$ei = undefined;
			} else if ($eh[0] === 1) {
				const kept2 = $eh[1];
				const cell2 = __clone(__at(previous_cells, kept2, "std/src/browser/web/ui.vl:2238:17"));
				set3(cell2, item, $cz, "std/src/browser/web/ui.vl:2239:11");
				next_cells.push(cell2);
				const $er = __at(cut, kept2, "std/src/browser/web/ui.vl:2241:12");
				let $es = null;
				if ($er[0] === 0) {
					const content2 = __clone($er[1]);
					insert_row(region, __at(previous_rows, kept2, "std/src/browser/web/ui.vl:2243:26"), content2, reference);
					$es = undefined;
				} else {
					$es = undefined;
				}
				$es;
				next_rows.push(__clone(__at(previous_rows, kept2, "std/src/browser/web/ui.vl:2247:21")));
				next_owners.push(__clone(__at(previous_owners, kept2, "std/src/browser/web/ui.vl:2248:23")));
				$ei = undefined;
			} else {
				const cell3 = new4(item, "std/src/browser/web/ui.vl:2251:44");
				const owner2 = new3();
				next_cells.push(__clone(cell3));
				next_rows.push(run_with_owner(owner2, ($dq) => {
					return open_row_before(region, render(cell3, $dq), reference, $cz, $dq);
				}));
				next_owners.push(owner2);
				$ei = undefined;
			}
			$ei;
			position = position + 1;
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		let $et = null;
		if (whole) {
			hold_rows(region, next_rows);
			row_keys.v = next_keys;
			row_items.v = __clone(list);
			row_cells.v = next_cells;
			row_owners.v = next_owners;
		} else {
			let taken = 0;
			while (taken < count) {
				__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2279:33");
				__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2280:37");
				__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2281:35");
				__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2282:33");
				__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2283:35");
				taken = taken + 1;
			}
			let offset = 0;
			while (offset < next_rows.length) {
				__insert_at(row_rows.v, at + offset, __clone(__at(next_rows, offset, "std/src/browser/web/ui.vl:2288:42")), "std/src/browser/web/ui.vl:2288:22");
				__insert_at(row_owners.v, at + offset, __clone(__at(next_owners, offset, "std/src/browser/web/ui.vl:2289:44")), "std/src/browser/web/ui.vl:2289:24");
				__insert_at(row_cells.v, at + offset, __clone(__at(next_cells, offset, "std/src/browser/web/ui.vl:2290:43")), "std/src/browser/web/ui.vl:2290:23");
				__insert_at(row_keys.v, at + offset, __clone(__at(next_keys, offset, "std/src/browser/web/ui.vl:2291:42")), "std/src/browser/web/ui.vl:2291:22");
				__insert_at(row_items.v, at + offset, __clone(__at(list, offset, "std/src/browser/web/ui.vl:2292:43")), "std/src/browser/web/ui.vl:2292:23");
				offset = offset + 1;
			}
			$et = undefined;
		}
		return $et;
	};
	const reconcile_pass = (list) => {
		return reconcile_span(0, row_rows.v.length, list);
	};
	const splice_rows = (at, removed, inserted) => {
		let taken = 0;
		while (taken < removed) {
			let $eu = null;
			if (at + 1 < row_rows.v.length) {
				$eu = __at(row_rows.v, at + 1, "std/src/browser/web/ui.vl:2307:5")[0];
			} else {
				$eu = region[0];
			}
			const end = __clone($eu);
			const going = __clone(__at(row_rows.v, at, "std/src/browser/web/ui.vl:2311:16"));
			const owner = __clone(__at(row_owners.v, at, "std/src/browser/web/ui.vl:2312:16"));
			retire_row(region, going, end, () => {
				return dispose2(owner);
			});
			__remove_at(row_rows.v, at, "std/src/browser/web/ui.vl:2314:32");
			__remove_at(row_owners.v, at, "std/src/browser/web/ui.vl:2315:36");
			__remove_at(row_cells.v, at, "std/src/browser/web/ui.vl:2316:34");
			__remove_at(row_keys.v, at, "std/src/browser/web/ui.vl:2317:32");
			__remove_at(row_items.v, at, "std/src/browser/web/ui.vl:2318:34");
			taken = taken + 1;
		}
		let $ev = null;
		if (at < row_rows.v.length) {
			$ev = __at(row_rows.v, at, "std/src/browser/web/ui.vl:2322:4")[0];
		} else {
			$ev = region[0];
		}
		const reference = __clone($ev);
		let offset = 0;
		for (const item of inserted) {
			const cell = new4(__clone(item), "std/src/browser/web/ui.vl:2328:42");
			const owner2 = new3();
			const row = run_with_owner(owner2, ($dw) => {
				return open_row_before(region, render(cell, $dw), reference, $cz, $dw);
			});
			__insert_at(row_rows.v, at + offset, row, "std/src/browser/web/ui.vl:2331:21");
			__insert_at(row_owners.v, at + offset, owner2, "std/src/browser/web/ui.vl:2332:23");
			__insert_at(row_cells.v, at + offset, __clone(cell), "std/src/browser/web/ui.vl:2333:22");
			__insert_at(row_keys.v, at + offset, key(item), "std/src/browser/web/ui.vl:2334:21");
			__insert_at(row_items.v, at + offset, __clone(item), "std/src/browser/web/ui.vl:2335:22");
			offset = offset + 1;
		}
		return;
	};
	const instance = open_rows2(source);
	const drain2 = instance[2];
	const run2 = subscriber_of(() => {
		for (const op of live_ops(drain2())) {
			const $eC = op;
			let $eD = null;
			if ($eC[0] === 0) {
				const at = $eC[1];
				const removed = $eC[2];
				const inserted = $eC[3];
				if (removed.length === 0 || inserted.length === 0) {
					splice_rows(at, removed.length, inserted);
				} else {
					reconcile_span(at, removed.length, inserted);
				}
				$eD = undefined;
			} else if ($eC[0] === 1) {
				const at2 = $eC[1];
				const _was = $eC[2];
				const value = $eC[3];
				const $eE = __list_get(row_keys.v, at2);
				let $eF = null;
				if ($eE[0] === 0) {
					const held = $eE[1];
					$eF = key(value) === held;
				} else {
					$eF = false;
				}
				const same_key = $eF;
				let $eI = null;
				if (same_key) {
					const $eG = __list_get(row_cells.v, at2);
					let $eH = null;
					if ($eG[0] === 0) {
						const cell = $eG[1];
						__at_put(row_items.v, at2, __clone(value), "std/src/browser/web/ui.vl:2369:9");
						set3(cell, value, $cz, "std/src/browser/web/ui.vl:2370:14");
						$eH = undefined;
					} else {
						$eH = undefined;
					}
					$eI = $eH;
				} else {
					splice_rows(at2, 1, [ __clone(value) ]);
				}
				$eD = $eI;
			} else if ($eC[0] === 2) {
				const items = $eC[1];
				$eD = reconcile_pass(items);
			} else {
				const from = $eC[1];
				const count = $eC[2];
				const to = $eC[3];
				let moved = __clone(row_items.v);
				let lifted = [  ];
				let taken = 0;
				while (taken < count) {
					lifted.push(__remove_at(moved, from, "std/src/browser/web/ui.vl:2388:25"));
					taken = taken + 1;
				}
				let offset = 0;
				for (const item of lifted) {
					__insert_at(moved, to + offset, __clone(item), "std/src/browser/web/ui.vl:2393:13");
					offset = offset + 1;
				}
				reconcile_pass(moved);
				$eD = undefined;
			}
			$eD;
		}
		return;
	}, false);
	place_subscriber(run2[0], caller);
	const handle = instance[1](run2);
	also_releasing(handle, instance[3]);
	take(get_owner($cA), handle, $cz);
	reconcile_pass(instance[0]());
}
function place7(self, parent, $cx, $cy, caller) {
	place_each_by2(parent, __clone(self[0]), self[1], self[2], $cx, $cy, caller);
}
function child7(self, content, $S, $T, caller) {
	place7(content, self, $S, $T, caller);
	return __clone(self);
}
function comp(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, scope ];
}
function set4(self, value, $eV, caller) {
	set3(self, value, $eV, caller);
}
function set_with(self, transform, $eU) {
	set4(self, transform(get(self)), $eU, "std/src/reactive.vl:2546:8");
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
const app_fill = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::overflow", [ "::overflow", [ 0, [ "syp1ckj", "overflow:hidden" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x0wn", "height:100%" ] ] ] ] ]), undefined ] ] ];
const quad_grid = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbipssh", "display:grid" ] ] ] ], [ "::flex", [ "::flex", [ 0, [ "smaui08", "flex:1 1 auto" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s1x5z460", "gap:1px" ] ] ] ], [ "::min-height", [ "::min-height", [ 0, [ "sivwxlf", "min-height:0" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1h4num7", "background-color:var(--stroke-hard)" ] ] ] ], [ "::grid-template-columns", [ "::grid-template-columns", [ 0, [ "send2h", "grid-template-columns:minmax(0, 1fr)" ] ] ] ], [ "::grid-template-rows", [ "::grid-template-rows", [ 0, [ "s11r85rj", "grid-template-rows:minmax(0, 8fr) minmax(0, 6fr) minmax(0, 4fr) minmax(0, 4fr)" ] ] ] ], [ "1024px::grid-template-columns", [ "1024px::grid-template-columns", [ 0, [ "s1ox8bcr", "grid-template-columns:minmax(0, 3fr) minmax(0, 2fr)" ] ] ] ], [ "1024px::grid-template-rows", [ "1024px::grid-template-rows", [ 0, [ "s1th8vpw", "grid-template-rows:minmax(0, 7fr) minmax(0, 3fr)" ] ] ] ] ]), undefined ] ] ];
const panel = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::overflow", [ "::overflow", [ 0, [ "syp1ckj", "overflow:hidden" ] ] ] ], [ "::flex-direction", [ "::flex-direction", [ 0, [ "s1atdsbb", "flex-direction:column" ] ] ] ], [ "::min-width", [ "::min-width", [ 0, [ "sitgfdt", "min-width:0" ] ] ] ], [ "::min-height", [ "::min-height", [ 0, [ "sivwxlf", "min-height:0" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ] ]), undefined ] ] ];
const panel_head = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ 0, [ "szotvx1", "flex-wrap:wrap" ] ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ 0, [ "s1lr51x", "flex-shrink:0" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyot", "gap:var(--space-1)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "sku5tg9", "padding-top:4px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzv99", "padding-bottom:4px" ] ] ] ], [ "::min-height", [ "::min-height", [ 0, [ "sonfe9c", "min-height:32px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ] ], [ "::box-sizing", [ "::box-sizing", [ 0, [ "s9fgd5j", "box-sizing:border-box" ] ] ] ], [ "::justify-content", [ "::justify-content", [ 0, [ "s1yv3ji6", "justify-content:space-between" ] ] ] ], [ "::border-bottom", [ "::border-bottom", [ 0, [ "sepksxk", "border-bottom:1px solid var(--stroke-soft)" ] ] ] ] ]), undefined ] ] ];
const app_bar = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ 0, [ "szotvx1", "flex-wrap:wrap" ] ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ 0, [ "s1lr51x", "flex-shrink:0" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyot", "gap:var(--space-1)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "sku5tg9", "padding-top:4px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzv99", "padding-bottom:4px" ] ] ] ], [ "::min-height", [ "::min-height", [ 0, [ "sonfe9c", "min-height:32px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ] ], [ "::box-sizing", [ "::box-sizing", [ 0, [ "s9fgd5j", "box-sizing:border-box" ] ] ] ], [ "::border-bottom", [ "::border-bottom", [ 0, [ "sehiopn", "border-bottom:1px solid var(--stroke-hard)" ] ] ] ] ]), undefined ] ] ];
const rail_divider = [ [ [ new Map([ [ "::width", [ "::width", [ 0, [ "sgdl0ko", "width:1px" ] ] ] ], [ "::align-self", [ "::align-self", [ 0, [ "s1h12z4", "align-self:stretch" ] ] ] ], [ "::margin-left", [ "::margin-left", [ 0, [ "szjswwl", "margin-left:2px" ] ] ] ], [ "::margin-right", [ "::margin-right", [ 0, [ "suw81y3", "margin-right:2px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1h4num7", "background-color:var(--stroke-hard)" ] ] ] ] ]), undefined ] ] ];
const page_title = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8awq", "line-height:16px" ] ] ] ], [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s1miqier", "color:var(--up-bright)" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ] ]), undefined ] ] ];
const panel_title = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8awq", "line-height:16px" ] ] ] ], [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzfp8", "font-weight:500" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ] ]), undefined ] ] ];
const editor_host = [ [ [ new Map([ [ "::overflow", [ "::overflow", [ 0, [ "syp1ckj", "overflow:hidden" ] ] ] ], [ "::flex", [ "::flex", [ 0, [ "smaui08", "flex:1 1 auto" ] ] ] ], [ "::min-height", [ "::min-height", [ 0, [ "sivwxlf", "min-height:0" ] ] ] ] ]), undefined ] ] ];
const runner_host = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::flex", [ "::flex", [ 0, [ "smaui08", "flex:1 1 auto" ] ] ] ], [ "::min-height", [ "::min-height", [ 0, [ "sivwxlf", "min-height:0" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ] ]), undefined ] ] ];
const ghost_button = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8awq", "line-height:16px" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "sku5tg9", "padding-top:4px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzv99", "padding-bottom:4px" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "s19qv9u6", "font-family:inherit" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jh8x", "border-radius:4px" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ] ], [ "::cursor", [ "::cursor", [ 0, [ "s1onu0uk", "cursor:pointer" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1wmjjx5", "background-color:transparent" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s1mnphwb", "border:none" ] ] ] ], [ ":hover:color", [ ":hover:color", [ 0, [ "s1ytnaev", "color:var(--up-bright)" ] ] ] ], [ ":hover:background-color", [ ":hover:background-color", [ 0, [ "s1s7tv0o", "background-color:var(--down-hover)" ] ] ] ], [ ":active:background-color", [ ":active:background-color", [ 0, [ "skghblk", "background-color:var(--down-active)" ] ] ] ] ]), undefined ] ] ];
const primary_button = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8awq", "line-height:16px" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "sku5tg9", "padding-top:4px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzv99", "padding-bottom:4px" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vfx", "padding-left:var(--space-3)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdpv", "padding-right:var(--space-3)" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "s19qv9u6", "font-family:inherit" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jh8x", "border-radius:4px" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "sj84onl", "transition:filter 80ms ease" ] ] ] ], [ "::cursor", [ "::cursor", [ 0, [ "s1onu0uk", "cursor:pointer" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s30khfz", "color:var(--primary-on)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s19dy6kf", "background-color:var(--primary)" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s1mnphwb", "border:none" ] ] ] ], [ ":hover:filter", [ ":hover:filter", [ 0, [ "s15eo8y8", "filter:brightness(1.08)" ] ] ] ], [ ":active:filter", [ ":active:filter", [ 0, [ "sdue9po", "filter:brightness(0.94)" ] ] ] ] ]), undefined ] ] ];
const select_box = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8awq", "line-height:16px" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "s1foenn1", "padding-top:0" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1hggi4x", "padding-bottom:0" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s16t3pvj", "padding-right:22px" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "s19qv9u6", "font-family:inherit" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jh8x", "border-radius:4px" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ] ], [ "::cursor", [ "::cursor", [ 0, [ "s1onu0uk", "cursor:pointer" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::appearance", [ "::appearance", [ 0, [ "sxfhabj", "appearance:none" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22xxov", "height:24px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "sg7ln4b", "background-image:linear-gradient(45deg, transparent 50%, currentcolor 50%), linear-gradient(135deg, currentcolor 50%, transparent 50%)" ] ] ] ], [ "::background-position", [ "::background-position", [ 0, [ "s1cysvk2", "background-position:calc(100% - 13px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px)" ] ] ] ], [ "::background-size", [ "::background-size", [ 0, [ "s1fnd457", "background-size:4px 4px, 4px 4px" ] ] ] ], [ "::background-repeat", [ "::background-repeat", [ 0, [ "s1q9mjsm", "background-repeat:no-repeat" ] ] ] ], [ "::box-sizing", [ "::box-sizing", [ 0, [ "s9fgd5j", "box-sizing:border-box" ] ] ] ], [ ":hover:color", [ ":hover:color", [ 0, [ "s1ytnaev", "color:var(--up-bright)" ] ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ 0, [ "s1of7ou7", "border-color:var(--stroke-hard)" ] ] ] ] ]), undefined ] ] ];
const version_select = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk1zs", "font-size:12px" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8awq", "line-height:16px" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "s1foenn1", "padding-top:0" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s1hggi4x", "padding-bottom:0" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s16t3pvj", "padding-right:22px" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::border-radius", [ "::border-radius", [ 0, [ "s94jh8x", "border-radius:4px" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "s1x0qwck", "transition:background-color 80ms ease, border-color 80ms ease, color 80ms ease" ] ] ] ], [ "::cursor", [ "::cursor", [ 0, [ "s1onu0uk", "cursor:pointer" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::appearance", [ "::appearance", [ 0, [ "sxfhabj", "appearance:none" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22xxov", "height:24px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1ydv2q1", "background-color:var(--down-normal)" ] ] ] ], [ "::border", [ "::border", [ 0, [ "s8ckzec", "border:1px solid var(--stroke-soft)" ] ] ] ], [ "::background-image", [ "::background-image", [ 0, [ "sg7ln4b", "background-image:linear-gradient(45deg, transparent 50%, currentcolor 50%), linear-gradient(135deg, currentcolor 50%, transparent 50%)" ] ] ] ], [ "::background-position", [ "::background-position", [ 0, [ "s1cysvk2", "background-position:calc(100% - 13px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px)" ] ] ] ], [ "::background-size", [ "::background-size", [ 0, [ "s1fnd457", "background-size:4px 4px, 4px 4px" ] ] ] ], [ "::background-repeat", [ "::background-repeat", [ 0, [ "s1q9mjsm", "background-repeat:no-repeat" ] ] ] ], [ "::box-sizing", [ "::box-sizing", [ 0, [ "s9fgd5j", "box-sizing:border-box" ] ] ] ], [ ":hover:color", [ ":hover:color", [ 0, [ "s1ytnaev", "color:var(--up-bright)" ] ] ] ], [ ":hover:border-color", [ ":hover:border-color", [ 0, [ "s1of7ou7", "border-color:var(--stroke-hard)" ] ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ 0, [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ] ]), undefined ] ] ];
const status_line = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8awq", "line-height:16px" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7ve3", "padding-left:var(--space-1)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdo1", "padding-right:var(--space-1)" ] ] ] ], [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::margin-left", [ "::margin-left", [ 0, [ "s10oplpw", "margin-left:auto" ] ] ] ], [ "::color", [ "::color", [ 0, [ "shpfnhp", "color:var(--up-dim)" ] ] ] ] ]), undefined ] ] ];
const confirm_bar = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::flex-wrap", [ "::flex-wrap", [ 0, [ "szotvx1", "flex-wrap:wrap" ] ] ] ], [ "::flex-shrink", [ "::flex-shrink", [ 0, [ "s1lr51x", "flex-shrink:0" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myypq", "gap:var(--space-2)" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "sku5tg9", "padding-top:4px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzv99", "padding-bottom:4px" ] ] ] ], [ "::min-height", [ "::min-height", [ 0, [ "sonfe9c", "min-height:32px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "ssxqr8g", "background-color:var(--down-bright)" ] ] ] ], [ "::box-sizing", [ "::box-sizing", [ 0, [ "s9fgd5j", "box-sizing:border-box" ] ] ] ], [ "::border-bottom", [ "::border-bottom", [ 0, [ "sepksxk", "border-bottom:1px solid var(--stroke-soft)" ] ] ] ] ]), undefined ] ] ];
const confirm_question = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "sbq2ipd", "letter-spacing:-0.01em" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8awq", "line-height:16px" ] ] ] ], [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::margin-right", [ "::margin-right", [ 0, [ "sp4tc1m", "margin-right:auto" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ] ]), undefined ] ] ];
const report_well = [ [ [ new Map([ [ "::font-family", [ "::font-family", [ 0, [ "sofexq0", "font-family:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::font-feature-settings", [ "::font-feature-settings", [ 0, [ "s1r74r55", "font-feature-settings:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ], [ "::overflow", [ "::overflow", [ 0, [ "s19aluk0", "overflow:auto" ] ] ] ], [ "::flex", [ "::flex", [ 0, [ "smaui08", "flex:1 1 auto" ] ] ] ], [ "::padding-top", [ "::padding-top", [ 0, [ "sku5tg9", "padding-top:4px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzv99", "padding-bottom:4px" ] ] ] ], [ "::margin", [ "::margin", [ 0, [ "s1tlfgp4", "margin:var(--space-0)" ] ] ] ], [ "::min-height", [ "::min-height", [ 0, [ "sivwxlf", "min-height:0" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8cl8", "line-height:18px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::white-space", [ "::white-space", [ 0, [ "s41qynl", "white-space:pre-wrap" ] ] ] ] ]), undefined ] ] ];
const diag_row_error = [ [ [ new Map([ [ "::padding-top", [ "::padding-top", [ 0, [ "sku5sm0", "padding-top:3px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzuf0", "padding-bottom:3px" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ], [ "::border-top", [ "::border-top", [ 0, [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ] ], [ "::border-left", [ "::border-left", [ 0, [ "s1v5t6xm", "border-left:2px solid var(--down-danger)" ] ] ] ], [ ":first-child:border-top", [ ":first-child:border-top", [ 0, [ "sq2xqkq", "border-top:1px solid transparent" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s1er9mcg", "background-color:rgb(from var(--down-danger) r g b / 0.07)" ] ] ] ] ]), undefined ] ] ];
const diag_row_warning = [ [ [ new Map([ [ "::padding-top", [ "::padding-top", [ 0, [ "sku5sm0", "padding-top:3px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzuf0", "padding-bottom:3px" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ], [ "::border-top", [ "::border-top", [ 0, [ "szweawk", "border-top:1px solid var(--stroke-soft)" ] ] ] ], [ "::border-left", [ "::border-left", [ 0, [ "somu7p8", "border-left:2px solid var(--down-caution)" ] ] ] ], [ ":first-child:border-top", [ ":first-child:border-top", [ 0, [ "sq2xqkq", "border-top:1px solid transparent" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s6ng1wh", "background-color:rgb(from var(--down-caution) r g b / 0.06)" ] ] ] ] ]), undefined ] ] ];
const diag_error = [ [ [ new Map([ [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "sxurvz1", "color:var(--up-error)" ] ] ] ] ]), undefined ] ] ];
const diag_warning = [ [ [ new Map([ [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::color", [ "::color", [ 0, [ "s7y076u", "color:var(--up-caution)" ] ] ] ] ]), undefined ] ] ];
const diag_site = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "shpfnhp", "color:var(--up-dim)" ] ] ] ] ]), undefined ] ] ];
const diag_note = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "shpfnhp", "color:var(--up-dim)" ] ] ] ] ]), undefined ] ] ];
const diag_trace = [ [ [ new Map([ [ "::color", [ "::color", [ 0, [ "shpfnhp", "color:var(--up-dim)" ] ] ] ] ]), undefined ] ] ];
const console_line = [ [ [ new Map([ [ "::padding-top", [ "::padding-top", [ 0, [ "sku5qxi", "padding-top:1px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzsqi", "padding-bottom:1px" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ] ]), undefined ] ] ];
const console_error = [ [ [ new Map([ [ "::padding-top", [ "::padding-top", [ 0, [ "sku5qxi", "padding-top:1px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzsqi", "padding-bottom:1px" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ], [ "::color", [ "::color", [ 0, [ "sxurvz1", "color:var(--up-error)" ] ] ] ] ]), undefined ] ] ];
const quiet_row = [ [ [ new Map([ [ "::padding-top", [ "::padding-top", [ 0, [ "sku5sm0", "padding-top:3px" ] ] ] ], [ "::padding-bottom", [ "::padding-bottom", [ 0, [ "s14jzuf0", "padding-bottom:3px" ] ] ] ], [ "::padding-left", [ "::padding-left", [ 0, [ "s13w7vf0", "padding-left:var(--space-2)" ] ] ] ], [ "::padding-right", [ "::padding-right", [ 0, [ "s1anvdoy", "padding-right:var(--space-2)" ] ] ] ], [ "::color", [ "::color", [ 0, [ "shpfnhp", "color:var(--up-dim)" ] ] ] ] ]), undefined ] ] ];
const code_palette = [ [ [ new Map([ [ "::--code-face", [ "::--code-face", [ 0, [ "sepvury", "--code-face:\'CommitMonoV143\', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ] ] ] ], [ "::--code-features", [ "::--code-features", [ 0, [ "s1xx7ixb", "--code-features:\"ss01\", \"ss02\", \"ss03\", \"ss04\", \"ss05\", \"cv04\", \"cv06\", \"cv08\"" ] ] ] ], [ "::--code-size", [ "::--code-size", [ 0, [ "s17tflw5", "--code-size:13px" ] ] ] ], [ "::--code-bg", [ "::--code-bg", [ 0, [ "sr79rlz", "--code-bg:var(--down-normal)" ] ] ] ], [ "::--code-fg", [ "::--code-fg", [ 0, [ "s19c5xn7", "--code-fg:var(--up-bright)" ] ] ] ], [ "::--code-dim", [ "::--code-dim", [ 0, [ "s1u3ovjb", "--code-dim:var(--up-dim)" ] ] ] ], [ "::--code-gutter-edge", [ "::--code-gutter-edge", [ 0, [ "s19k3kma", "--code-gutter-edge:var(--stroke-soft)" ] ] ] ], [ "::--code-active-line", [ "::--code-active-line", [ 0, [ "s1fhczbb", "--code-active-line:rgb(from var(--up-bright) r g b / 0.04)" ] ] ] ], [ "::--code-active-gutter", [ "::--code-active-gutter", [ 0, [ "s1t1pcq8", "--code-active-gutter:rgb(from var(--up-bright) r g b / 0.07)" ] ] ] ], [ "::--code-selection", [ "::--code-selection", [ 0, [ "snky57a", "--code-selection:rgb(from var(--up-bright) r g b / 0.18)" ] ] ] ], [ "::--code-keyword", [ "::--code-keyword", [ 0, [ "sbb9pzp", "--code-keyword:var(--primary)" ] ] ] ], [ "::--code-string", [ "::--code-string", [ 0, [ "s18b2uzn", "--code-string:var(--accent)" ] ] ] ], [ "::--code-plain", [ "::--code-plain", [ 0, [ "s8onzey", "--code-plain:var(--up-normal)" ] ] ] ], [ "::--code-callable", [ "::--code-callable", [ 0, [ "s16k06qr", "--code-callable:var(--tint-callable)" ] ] ] ], [ "::--code-type", [ "::--code-type", [ 0, [ "s1n2n3b1", "--code-type:var(--up-bright)" ] ] ] ], [ "::--code-comment", [ "::--code-comment", [ 0, [ "s5j3euk", "--code-comment:var(--tint-comment)" ] ] ] ], [ "::--code-attr", [ "::--code-attr", [ 0, [ "s14j98t0", "--code-attr:rgb(from var(--primary) r g b / 0.65)" ] ] ] ], [ "::--code-path", [ "::--code-path", [ 0, [ "s7em04x", "--code-path:rgb(from var(--up-bright) r g b / 0.6)" ] ] ] ], [ "::--code-operator", [ "::--code-operator", [ 0, [ "s8nt3s2", "--code-operator:rgb(from var(--up-bright) r g b / 0.72)" ] ] ] ], [ "::--code-error", [ "::--code-error", [ 0, [ "s1dxptvb", "--code-error:var(--up-error)" ] ] ] ], [ "::--code-caution", [ "::--code-caution", [ 0, [ "s1yauy2a", "--code-caution:var(--up-caution)" ] ] ] ] ]), undefined ] ] ];
const shell = [ [ [ new Map([ [ "::min-height", [ "::min-height", [ 0, [ "sondrfd", "min-height:100%" ] ] ] ], [ "::font-family", [ "::font-family", [ 0, [ "s1om2gx7", "font-family:\'Inter\', system-ui, -apple-system, sans-serif" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk3oa", "font-size:14px" ] ] ] ], [ "::line-height", [ "::line-height", [ 0, [ "snq8cl8", "line-height:18px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "s4e3ofu", "background-color:var(--down-dim)" ] ] ] ] ]), undefined ] ] ];
const no_drag = [ [ [ new Map([ [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ "::-webkit-user-drag", [ "::-webkit-user-drag", [ 0, [ "svfmjlf", "-webkit-user-drag:none" ] ] ] ] ]), undefined ] ] ];
const nav_brand = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sbiovxm", "display:flex" ] ] ] ], [ "::gap", [ "::gap", [ 0, [ "s8myyqn", "gap:var(--space-3)" ] ] ] ], [ "::align-items", [ "::align-items", [ 0, [ "s1rpzmas", "align-items:center" ] ] ] ], [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::font-weight", [ "::font-weight", [ 0, [ "skjzgjh", "font-weight:600" ] ] ] ], [ "::letter-spacing", [ "::letter-spacing", [ 0, [ "s1odkmbv", "letter-spacing:0.35em" ] ] ] ] ]), undefined ] ] ];
const nav_mark = [ [ [ new Map([ [ "::display", [ "::display", [ 0, [ "sowfjmu", "display:block" ] ] ] ], [ "::width", [ "::width", [ 0, [ "s178hbq8", "width:36px" ] ] ] ], [ "::height", [ "::height", [ 0, [ "s22x9bm", "height:18px" ] ] ] ], [ "::background-color", [ "::background-color", [ 0, [ "syz58y5", "background-color:var(--up-bright)" ] ] ] ], [ "::-webkit-mask", [ "::-webkit-mask", [ 0, [ "scqkrg6", "-webkit-mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ] ], [ "::mask", [ "::mask", [ 0, [ "s11mtiwm", "mask:url(https://vilan-lang.org/assets/mark.svg) center / contain no-repeat" ] ] ] ] ]), undefined ] ] ];
const nav_link = [ [ [ new Map([ [ "::font-size", [ "::font-size", [ 0, [ "sayk2u1", "font-size:13px" ] ] ] ], [ "::color", [ "::color", [ 0, [ "ssxqrx8", "color:var(--up-normal)" ] ] ] ], [ "::text-decoration", [ "::text-decoration", [ 0, [ "svrgm1f", "text-decoration:none" ] ] ] ], [ "::transition", [ "::transition", [ 0, [ "sbcnc8a", "transition:color 80ms ease" ] ] ] ], [ "::user-select", [ "::user-select", [ 0, [ "s1iy45h3", "user-select:none" ] ] ] ], [ ":hover:color", [ ":hover:color", [ 0, [ "s1ytnaev", "color:var(--up-bright)" ] ] ] ] ]), undefined ] ] ];
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
	let $eR = null;
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
		$eR = undefined;
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
		$eR = undefined;
	} else if (kind === "formatted") {
		const declined = event.declined;
		if (declined !== "") {
			set(status, "Format left the buffer unchanged \u{2014} " + declined, [ 1 ], "src/playground.vl:509:12");
		} else if (event.changed) {
			set(status, "Formatted.", [ 1 ], "src/playground.vl:511:12");
		} else {
			set(status, "Format made no changes.", [ 1 ], "src/playground.vl:513:12");
		}
		$eR = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			set(status, "Link copied to the clipboard.", [ 1 ], "src/playground.vl:517:12");
			flash_share("Copied!");
		} else {
			set(status, "Link ready in the address bar.", [ 1 ], "src/playground.vl:520:12");
			flash_share("Link ready");
		}
		$eR = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $eS = null;
		if (event.ok) {
			if (event.platform === "node") {
				set(status, "No problems (server check, vilan " + event.version + ").", [ 1 ], "src/playground.vl:528:13");
			} else {
				set(status, "No problems (vilan " + event.version + ").", [ 1 ], "src/playground.vl:530:13");
			}
			$eS = undefined;
		} else if (count === 1) {
			set(status, "1 problem; see the diagnostics.", [ 1 ], "src/playground.vl:533:12");
		} else {
			set(status, "" + count + " problems; see the diagnostics.", [ 1 ], "src/playground.vl:535:12");
		}
		$eR = $eS;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $eT = null;
		if (event.platform === "node") {
			if (event.ok) {
				set(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ], "src/playground.vl:543:13");
			} else {
				set(status, "Build failed; see the diagnostics.", [ 1 ], "src/playground.vl:545:13");
			}
			$eT = undefined;
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
			$eT = undefined;
		}
		$eR = $eT;
	} else if (kind === "crash") {
		set(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ], "src/playground.vl:565:11");
	}
	return $eR;
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
