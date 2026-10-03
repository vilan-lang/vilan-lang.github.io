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
function __remove_at(list, index) {
	if (index >= 0 && index < list.length) return list.splice(index, 1)[0];
	throw "index out of bounds: the length is " + list.length + " but the index is " + index;
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
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $E) {
	return await (self[0].wait(ambient_signal($E)));
}
function cancel(self) {
	self[0].cancel();
}
function has_spawned(self) {
	return __nursery_has_spawned(self);
}
function ambient_signal($F) {
	const $G = $F;
	let $H = null;
	if ($G[0] === 0) {
		const n = $G[1];
		$H = [ 0, n.signal_of() ];
	} else {
		$H = [ 1 ];
	}
	return $H;
}
function detached_nursery() {
	return __nursery_new_detached();
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
	return $n(self[0].v) && $n(self[1].v);
}
function enqueue(turn, subscribers) {
	for (const subscriber of subscribers) {
		const key = hash2(subscriber[0]);
		let $m = null;
		if (subscriber[3]) {
			if (!(turn[3].v.has(key))) {
				turn[3].v.set(key, true);
				turn[1].v.push(__clone(subscriber));
			}
			$m = undefined;
		} else if (!(turn[2].v.has(key))) {
			turn[2].v.set(key, true);
			let index = turn[0].v.length;
			while (index > 0 && __at(turn[0].v, index - 1)[0] > subscriber[0]) {
				index = index - 1;
			}
			__insert_at(turn[0].v, index, __clone(subscriber));
		}
		$m;
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
				while (!($n(turn[1].v)) && budget > 0) {
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
	const $bK = turn;
	let $bL = null;
	if ($bK[0] === 0) {
		const ambient = $bK[1];
		$bL = enqueue(ambient, [ reissued(subscriber) ]);
	} else {
		const $bM = $o(draining_turns.v);
		let $bN = null;
		if ($bM[0] === 0) {
			const draining = $bM[1];
			$bN = enqueue(draining, [ reissued(subscriber) ]);
		} else {
			if (subscriber[2].v) {
				subscriber[1]();
			}
			$bN = undefined;
		}
		$bL = $bN;
	}
	return $bL;
}
function reissued(subscriber) {
	return [ subscriber[0], subscriber[1], subscriber[2], subscriber[3] ];
}
function wake(subscriber) {
	defer_subscriber([ 1 ], subscriber);
}
function dispose(self, $cm) {
	const $cn = $cm;
	let $co = null;
	if ($cn[0] === 0) {
		const established = $cn[1];
		$co = [ 0, established ];
	} else {
		$co = $o(draining_turns.v);
	}
	const ambient = $co;
	release_under(self, ambient);
}
function detach(handle) {
	const $bR = $o(releasing_turns.v);
	let $bS = null;
	if ($bR[0] === 0) {
		const at_release = $bR[1];
		$bS = at_release;
	} else {
		$bS = $o(draining_turns.v);
	}
	const turn = $bS;
	release_under(handle, turn);
}
function release_under(handle, ambient) {
	handle[2].v = false;
	const $bT = [ 0, handle[0] ];
	let $bU = null;
	if ($bT[0] === 0) {
		const subscribers = $bT[1];
		let kept = [  ];
		for (const subscriber of subscribers.v) {
			if (subscriber[0] !== handle[1]) {
				kept.push(__clone(subscriber));
			}
		}
		subscribers.v = kept;
		$bU = undefined;
	} else {
		$bU = undefined;
	}
	$bU;
	const $bV = ambient;
	let $bW = null;
	if ($bV[0] === 0) {
		const turn = $bV[1];
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
		$bW = undefined;
	} else {
		$bW = undefined;
	}
	$bW;
	const $bX = handle[3].v;
	let $bY = null;
	if ($bX[0] === 0) {
		const release = $bX[1];
		handle[3].v = [ 1 ];
		releasing_turns.v.push(ambient);
		__with_finally(release, () => {
			__list_pop(releasing_turns.v);
			return;
		});
		$bY = undefined;
	} else {
		$bY = undefined;
	}
	return $bY;
}
function new3() {
	return [ __shared_new([ 0, no_cleanups, false, [ 1 ] ]), 0 ];
}
function is_disposed(self) {
	return self[0].v[0] !== self[1];
}
function defer(self, cleanup) {
	let $aF = null;
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
		$aF = undefined;
	}
	return $aF;
}
function renew(self) {
	const $bf = self[0].v[3];
	let $bg = null;
	if ($bf[0] === 0) {
		const nursery2 = __clone($bf[1]);
		let $bh = null;
		if (has_spawned(nursery2)) {
			$bh = [ 1 ];
		} else {
			$bh = [ 0, nursery2 ];
		}
		$bg = $bh;
	} else {
		$bg = [ 1 ];
	}
	const carried = $bg;
	advance([ self[0], self[0].v[0] ], carried);
	if ($bk(self[0].v[3])) {
		run_nurseries_allocated_count.v = run_nurseries_allocated_count.v + 1;
		self[0].v[3] = [ 0, detached_nursery() ];
	}
	return [ self[0], self[0].v[0] ];
}
function nursery(self) {
	let $bu = null;
	if (is_disposed(self)) {
		$bu = [ 1 ];
	} else {
		$bu = self[0].v[3];
	}
	return $bu;
}
function dispose2(self) {
	advance(self, [ 1 ]);
}
function advance(self, carried) {
	let $bt = null;
	if (!(is_disposed(self))) {
		const held = self[0].v;
		self[0].v = [ self[1] + 1, no_cleanups, false, carried ];
		const $bi = held[3];
		let $bj = null;
		if ($bi[0] === 0) {
			const nursery2 = $bi[1];
			if ($bk(carried)) {
				nursery2.cancel();
			}
			$bj = undefined;
		} else {
			$bj = undefined;
		}
		$bj;
		let $bs = null;
		if (held[2]) {
			let failure = [ 1 ];
			for (const cleanup of held[1].v) {
				const $bm = __guarded(cleanup);
				let $bn = null;
				if ($bm[0] === 0) {
					const message = $bm[1];
					if ($bk(failure)) {
						failure = [ 0, message ];
					}
					$bn = undefined;
				} else {
					$bn = undefined;
				}
				$bn;
			}
			const $bq = failure;
			let $br = null;
			if ($bq[0] === 0) {
				const message2 = $bq[1];
				$br = (() => {
					throw message2;
				})();
			} else {
				$br = undefined;
			}
			$bs = $br;
		}
		$bt = $bs;
	}
	return $bt;
}
function get_owner($aE) {
	return $aE;
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
	const $aY = tracker[0].v[6];
	let $aZ = null;
	if ($aY[0] === 0) {
		const lists = $aY[1];
		if (!($n(lists.v[0]))) {
			lists.v[0] = [  ];
		}
		$aZ = undefined;
	} else {
		$aZ = undefined;
	}
	$aZ;
	return [ __clone(tracker), epoch ];
}
function close_run(tracker) {
	tracker[0].v[1] = false;
	const $bz = tracker[0].v[6];
	let $bA = null;
	if ($bz[0] === 0) {
		const lists = $bz[1];
		$bA = lists;
	} else {
		return;
		$bA = undefined;
	}
	const lists2 = $bA;
	const $bB = tracker[0].v[5];
	let $bC = null;
	if ($bB[0] === 0) {
		const target = __clone($bB[1]);
		$bC = reconnect(tracker, lists2, target);
	} else {
		if (!($n(lists2.v[0])) || !($n(lists2.v[1]))) {
			lists2.v[1] = __clone(lists2.v[0]);
		}
		$bC = undefined;
	}
	$bC;
	if (!($n(lists2.v[0]))) {
		lists2.v[0] = [  ];
	}
}
function reconnect(tracker, lists, target) {
	if ($n(lists.v[0]) && $n(lists.v[2])) {
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
		const $bI = reusable(held, kept, dependency[0], position);
		let $bJ = null;
		if ($bI[0] === 0) {
			const index = $bI[1];
			__at_put(kept, index, true);
			next.push(__clone(__at(held, index)));
			$bJ = undefined;
		} else {
			next.push([ dependency[0], dependency[1](relay_for(tracker, target)) ]);
			$bJ = undefined;
		}
		$bJ;
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
	const $bE = identity;
	let $bF = null;
	if ($bE[0] === 0) {
		const wanted = $bE[1];
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
		$bF = [ 1 ];
	} else {
		$bF = [ 1 ];
	}
	return $bF;
}
function same_identity(identity, wanted) {
	const $bG = identity;
	let $bH = null;
	if ($bG[0] === 0) {
		const held = $bG[1];
		$bH = held === wanted;
	} else {
		$bH = false;
	}
	return $bH;
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
	const $cc = tracker[0].v[6];
	let $cd = null;
	if ($cc[0] === 0) {
		const lists = $cc[1];
		$cd = lists;
	} else {
		return;
		$cd = undefined;
	}
	const lists2 = $cd;
	let $ce = null;
	if (!($n(lists2.v[1]))) {
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
		$ce = undefined;
	}
	return $ce;
}
function forget_reads(tracker) {
	const $cf = tracker[0].v[6];
	let $cg = null;
	if ($cf[0] === 0) {
		const lists = $cf[1];
		$cg = lists;
	} else {
		return;
		$cg = undefined;
	}
	const lists2 = $cg;
	let $ch = null;
	if (!($n(lists2.v[2]))) {
		const edges = __clone(lists2.v[2]);
		lists2.v[2] = [  ];
		for (const edge of edges) {
			detach(edge[1]);
		}
		$ch = undefined;
	}
	$ch;
	if (!($n(lists2.v[1]))) {
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
		const $ci = previous;
		let $cj = null;
		if ($ci[0] === 0) {
			const earlier = $ci[1];
			$cj = earlier();
		} else {
			$cj = undefined;
		}
		return $cj;
	} ];
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
	const $aa = property;
	let $ab = null;
	if ($aa === "padding") {
		$ab = ";padding-top;padding-right;padding-bottom;padding-left;";
	} else if ($aa === "margin") {
		$ab = ";margin-top;margin-right;margin-bottom;margin-left;";
	} else if ($aa === "inset") {
		$ab = ";top;right;bottom;left;";
	} else if ($aa === "flex") {
		$ab = ";flex-grow;flex-shrink;flex-basis;";
	} else if ($aa === "background") {
		$ab = ";background-color;background-image;background-position;background-size;background-repeat;background-attachment;background-origin;background-clip;";
	} else if ($aa === "border") {
		$ab = border_longhands();
	} else {
		$ab = "";
	}
	return $ab;
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
	for (const key of $U(rules)) {
		const slot = slot_of(key);
		if (slot[0] === media && slot[1] === condition && longhands.includes(";" + slot[2] + ";")) {
			$ac(out, key);
		}
	}
	return out;
}
function class_list(self) {
	let out = "";
	for (const entry of $ae(self[0])) {
		const $af = entry;
		const class2 = $af[0];
		const _declaration = $af[1];
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
	for (const key of $U(b[0])) {
		const $Y = $V(b[0], key);
		let $Z = null;
		if ($Y[0] === 0) {
			const entry = $Y[1];
			const slot = slot_of(key);
			rules = without_covered(rules, slot[0], slot[1], slot[2]);
			$ad(rules, key, entry);
			$Z = undefined;
		} else {
			$Z = undefined;
		}
		$Z;
	}
	return [ rules ];
}
function view(tag) {
	let $T = null;
	if (is_svg_tag(tag)) {
		$T = [ document.createElementNS("http://www.w3.org/2000/svg", tag) ];
	} else {
		$T = [ document.createElement(tag) ];
	}
	return $T;
}
function is_svg_tag(tag) {
	const $R = tag;
	let $S = null;
	if ($R === "svg") {
		$S = true;
	} else if ($R === "path") {
		$S = true;
	} else if ($R === "circle") {
		$S = true;
	} else if ($R === "ellipse") {
		$S = true;
	} else if ($R === "rect") {
		$S = true;
	} else if ($R === "line") {
		$S = true;
	} else if ($R === "polyline") {
		$S = true;
	} else if ($R === "polygon") {
		$S = true;
	} else if ($R === "g") {
		$S = true;
	} else if ($R === "defs") {
		$S = true;
	} else if ($R === "use") {
		$S = true;
	} else if ($R === "symbol") {
		$S = true;
	} else if ($R === "marker") {
		$S = true;
	} else if ($R === "pattern") {
		$S = true;
	} else if ($R === "mask") {
		$S = true;
	} else if ($R === "clipPath") {
		$S = true;
	} else if ($R === "linearGradient") {
		$S = true;
	} else if ($R === "radialGradient") {
		$S = true;
	} else if ($R === "stop") {
		$S = true;
	} else if ($R === "text") {
		$S = true;
	} else if ($R === "tspan") {
		$S = true;
	} else if ($R === "textPath") {
		$S = true;
	} else if ($R === "filter") {
		$S = true;
	} else if ($R === "foreignObject") {
		$S = true;
	} else if ($R === "feGaussianBlur") {
		$S = true;
	} else if ($R === "feColorMatrix") {
		$S = true;
	} else if ($R === "feOffset") {
		$S = true;
	} else if ($R === "feMerge") {
		$S = true;
	} else if ($R === "feMergeNode") {
		$S = true;
	} else if ($R === "feFlood") {
		$S = true;
	} else if ($R === "feComposite") {
		$S = true;
	} else if ($R === "feBlend") {
		$S = true;
	} else if ($R === "feDropShadow") {
		$S = true;
	} else {
		$S = false;
	}
	return $S;
}
function styled(self, style) {
	self[0].setAttribute("class", class_list(style));
	return __clone(self);
}
function on(self, event, handler) {
	self[0].addEventListener(event, () => {
		return $aq([ 1 ], ($ap) => {
			return (() => {
				return handler($ap, [ 1 ]);
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
		let $eb = null;
		if (at + 1 < rows.length) {
			$eb = __at(rows, at + 1)[0];
		} else {
			$eb = self[0];
		}
		const end = __clone($eb);
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
		const $es = step;
		let $et = null;
		if ($es[0] === 0) {
			const index = $es[1];
			const $eu = highest;
			let $ev = null;
			if ($eu[0] === 0) {
				const top = $eu[1];
				$ev = index > top;
			} else {
				$ev = true;
			}
			const rises = $ev;
			if (rises) {
				highest = [ 0, index ];
				forward_count = forward_count + 1;
				forward.push(true);
			} else {
				forward.push(false);
			}
			$et = undefined;
		} else {
			forward.push(false);
			$et = undefined;
		}
		$et;
	}
	let backward = [  ];
	let backward_count = 0;
	let lowest = steps.length;
	let at = steps.length;
	while (at > 0) {
		at = at - 1;
		const $ew = __at(steps, at);
		let $ex = null;
		if ($ew[0] === 0) {
			const index2 = $ew[1];
			if (index2 < lowest) {
				lowest = index2;
				backward_count = backward_count + 1;
				backward.push(true);
			} else {
				backward.push(false);
			}
			$ex = undefined;
		} else {
			backward.push(false);
			$ex = undefined;
		}
		$ex;
	}
	let $ey = null;
	if (forward_count >= backward_count) {
		$ey = forward;
	} else {
		$ey = $ez(backward);
	}
	return $ey;
}
function row_references(steps, rows, settled, anchor) {
	let references = [  ];
	let reference = __clone(anchor);
	let at = steps.length;
	while (at > 0) {
		at = at - 1;
		references.push(__clone(reference));
		let $eC = null;
		if (__at(settled, at)) {
			const $eA = __at(steps, at);
			let $eB = null;
			if ($eA[0] === 0) {
				const index = $eA[1];
				reference = __clone(__at(rows, index)[0]);
				$eB = undefined;
			} else {
				$eB = undefined;
			}
			$eC = $eB;
		}
		$eC;
	}
	return $ez(references);
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
	const $gV = $aq([ 1 ], ($gS) => {
		return $gT(body);
	});
	const built = $gV[0];
	const root = $gV[1];
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
function template_option(value, label, $cB, $cC) {
	return $am($ag(view("option"), "value", value, $cB, $cC), label, $cB, $cC);
}
function template_title(name) {
	const $cV = name;
	let $cW = null;
	if ($cV === "counter") {
		$cW = "Counter";
	} else if ($cV === "hello") {
		$cW = "Hello";
	} else if ($cV === "styles") {
		$cW = "Styles";
	} else if ($cV === "server") {
		$cW = "Server";
	} else {
		$cW = name;
	}
	return $cW;
}
function severity_tag(row, $dJ, $dK) {
	const $dL = row[1];
	let $dM = null;
	if ($dL === "error") {
		$dM = $am(styled(view("span"), diag_error), "error", $dJ, $dK);
	} else {
		$dM = $am(styled(view("span"), diag_warning), "warning", $dJ, $dK);
	}
	return $dM;
}
function trace_row(hop, $dN, $dO) {
	let $dP = null;
	if (hop[4]) {
		$dP = "  via " + hop[0] + ":" + hop[1] + ":" + hop[2] + " \u{2014} " + hop[3];
	} else {
		$dP = "  " + hop[3];
	}
	const text = $dP;
	return $am(styled(view("div"), diag_trace), text, $dN, $dO);
}
function diagnostic_row(row, $dH, $dI) {
	const head = $aj($aj($aj(view("div"), severity_tag(row, $dH, $dI), $dH, $dI), $am(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " ", $dH, $dI), $dH, $dI), $am(view("span"), row[5], $dH, $dI), $dH, $dI);
	let lines = [ head ];
	for (const hop of row[7]) {
		lines.push(trace_row(hop, $dH, $dI));
	}
	if (row[6] !== "") {
		lines.push($am(styled(view("div"), diag_note), "  note: " + row[6], $dH, $dI));
	}
	const body = $dQ(view("div"), lines, $dH, $dI);
	const $dR = row[1];
	let $dS = null;
	if ($dR === "error") {
		$dS = $aj(styled(view("div"), diag_row_error), body, $dH, $dI);
	} else {
		$dS = $aj(styled(view("div"), diag_row_warning), body, $dH, $dI);
	}
	return $dS;
}
function console_row(row, $fL, $fM) {
	const $fN = row[1];
	let $fO = null;
	if ($fN === "error") {
		$fO = $am(styled(view("div"), console_error), row[2], $fL, $fM);
	} else {
		$fO = $am(styled(view("div"), console_line), row[2], $fL, $fM);
	}
	return $fO;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, can_prelude2, share_label2, mode2, modified_from2, confirm_target2, run2, format2, share2, confirm_replace2, cancel_replace2, $P, $Q) {
	return $aj($aj(styled(view("div"), add(add(shell, app_fill), code_palette)), $aj($aj($aj($aj($aj($aj($aj($aj($aj($aj($aj($aj(styled(view("header"), app_bar), $aj($aj($ag(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $P, $Q), $ag(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $P, $Q), $P, $Q), $am(view("span"), "VILAN", $P, $Q), $P, $Q), $P, $Q), $am(styled(view("h1"), page_title), "Playground", $P, $Q), $P, $Q), styled(view("div"), rail_divider), $P, $Q), $ax(on(styled(view("button"), primary_button), "click", ($an, $ao) => {
		return run2();
	}), $aw(__clone(mode2), (current, $ar, $as, $at) => {
		const $au = current;
		let $av = null;
		if ($au === "node") {
			$av = "Check";
		} else {
			$av = "Run";
		}
		return $av;
	}), $P, $Q), $P, $Q), $aj($aj($cp($ag($ag(styled(view("select"), select_box), "id", "mode", $P, $Q), "aria-label", "Compile mode", $P, $Q), __clone(can_platform2), $P, $Q), template_option("browser", "Browser: compile and run", $P, $Q), $P, $Q), template_option("node", "Server: check the process leg", $P, $Q), $P, $Q), $P, $Q), $aj($aj($aj($cp($ag($ag(styled(view("select"), select_box), "id", "prelude", $P, $Q), "aria-label", "Ambient scope", $P, $Q), __clone(can_prelude2), $P, $Q), template_option("on", "Prelude: on", $P, $Q), $P, $Q), template_option("web", "Prelude: web", $P, $Q), $P, $Q), template_option("off", "Prelude: off", $P, $Q), $P, $Q), $P, $Q), $am($cp(on(styled(view("button"), ghost_button), "click", ($cD, $cE) => {
		return format2();
	}), __clone(can_format2), $P, $Q), "Format", $P, $Q), $P, $Q), $cH(on(styled(view("button"), ghost_button), "click", ($cF, $cG) => {
		return share2();
	}), __clone(share_label2), $P, $Q), $P, $Q), $cH($ag(styled(view("p"), status_line), "role", "status", $P, $Q), __clone(status2), $P, $Q), $P, $Q), $ag($ag(styled(view("select"), version_select), "id", "version", $P, $Q), "aria-label", "Compiler version", $P, $Q), $P, $Q), styled(view("div"), rail_divider), $P, $Q), $am($ag(styled(view("a"), nav_link), "href", "/docs/", $P, $Q), "Docs", $P, $Q), $P, $Q), $P, $Q), $aj($aj($aj($aj(styled(view("main"), quad_grid), $aj($aj($aj(styled(view("div"), panel), $aj($aj(styled(view("div"), panel_head), $am(styled(view("p"), panel_title), "Program", $P, $Q), $P, $Q), $aj($aj($aj($aj($aj($ag($ag(styled(view("select"), select_box), "id", "template", $P, $Q), "aria-label", "Load an example", $P, $Q), $ax($ag($ag($ag(view("option"), "disabled", "true", $P, $Q), "hidden", "true", $P, $Q), "value", "", $P, $Q), $aw(__clone(modified_from2), (name, $cQ, $cR, $cS) => {
		const $cT = name;
		let $cU = null;
		if ($cT === "") {
			$cU = "Examples";
		} else {
			$cU = "Modified \u{2014} " + template_title(name);
		}
		return $cU;
	}), $P, $Q), $P, $Q), template_option("counter", "Counter: reactive state", $P, $Q), $P, $Q), template_option("hello", "Hello: mount and print", $P, $Q), $P, $Q), template_option("styles", "Styles: compile-time CSS", $P, $Q), $P, $Q), $cp(template_option("server", "Server: typed HTTP, checked", $P, $Q), __clone(can_platform2), $P, $Q), $P, $Q), $P, $Q), $P, $Q), $aj($db($ag(view("div"), "role", "alert", $P, $Q), $aw(__clone(confirm_target2), (name, $cX, $cY, $cZ) => {
		return name !== "";
	}), $P, $Q), $aj($aj($aj(styled(view("div"), confirm_bar), $ax(styled(view("p"), confirm_question), $aw(__clone(confirm_target2), (name, $dl, $dm, $dn) => {
		return "Replace the current program with " + template_title(name) + "? The edits are not kept.";
	}), $P, $Q), $P, $Q), $am(on(styled(view("button"), ghost_button), "click", ($do, $dp) => {
		return cancel_replace2();
	}), "Keep editing", $P, $Q), $P, $Q), $am(on(styled(view("button"), primary_button), "click", ($dq, $dr) => {
		return confirm_replace2();
	}), "Replace", $P, $Q), $P, $Q), $P, $Q), $P, $Q), $ag($ag(styled(view("div"), editor_host), "id", "editor", $P, $Q), "aria-label", "Program editor", $P, $Q), $P, $Q), $P, $Q), $aj($aj(styled(view("div"), panel), $aj(styled(view("div"), panel_head), $am(styled(view("p"), panel_title), "Result", $P, $Q), $P, $Q), $P, $Q), $ag($ag(styled(view("div"), runner_host), "id", "runner", $P, $Q), "aria-label", "Program result", $P, $Q), $P, $Q), $P, $Q), $aj($aj(styled(view("div"), panel), $aj(styled(view("div"), panel_head), $am(styled(view("p"), panel_title), "Diagnostics", $P, $Q), $P, $Q), $P, $Q), $dU($aj(styled(view("pre"), report_well), $am($dw(styled(view("div"), quiet_row), $aw(__clone(diagnostics2), (rows, $ds, $dt, $du) => {
		return rows.length === 0;
	}), $P, $Q), "Nothing to report.", $P, $Q), $P, $Q), $dT(__clone(diagnostics2), (row) => {
		return row[0];
	}, (row, $dF) => {
		return diagnostic_row($B(row), $P, $dF);
	}), $P, $Q), $P, $Q), $P, $Q), $aj($aj(styled(view("div"), panel), $aj(styled(view("div"), panel_head), $am(styled(view("p"), panel_title), "Console", $P, $Q), $P, $Q), $P, $Q), $fQ($aj(styled(view("pre"), report_well), $am($fA(styled(view("div"), quiet_row), $aw(__clone(console_lines2), (rows, $fw, $fx, $fy) => {
		return rows.length === 0;
	}), $P, $Q), "Program output lands here.", $P, $Q), $P, $Q), $dT(__clone(console_lines2), (row) => {
		return row[0];
	}, (row, $fJ) => {
		return console_row($B(row), $P, $fJ);
	}), $P, $Q), $P, $Q), $P, $Q), $P, $Q);
}
function $b(value) {
	let subscribers = [  ];
	return [ __shared_new(value), __shared_new(subscribers) ];
}
function $a(value) {
	return $b(value);
}
function $c(value) {
	return $b(value);
}
function $n(self) {
	return self.length === 0;
}
function $o(self) {
	let $q = null;
	if ($n(self)) {
		$q = [ 1 ];
	} else {
		$q = __list_get(self, self.length - 1);
	}
	return $q;
}
function $i(self, $j) {
	const $k = $j;
	let $l = null;
	if ($k[0] === 0) {
		const turn = $k[1];
		$l = enqueue(turn, __clone(self[1].v));
	} else {
		const $r = $o(draining_turns.v);
		let $s = null;
		if ($r[0] === 0) {
			const draining = $r[1];
			$s = enqueue(draining, __clone(self[1].v));
		} else {
			for (const subscriber of __clone(self[1].v)) {
				if (subscriber[2].v) {
					subscriber[1]();
				}
			}
			$s = undefined;
		}
		$l = $s;
	}
	return $l;
}
function $g(self, value, $h) {
	self[0].v = __clone(value);
	$i(self, $h);
}
function $w(self, $j) {
	const $x = $j;
	let $y = null;
	if ($x[0] === 0) {
		const turn = $x[1];
		$y = enqueue(turn, __clone(self[1].v));
	} else {
		const $z = $o(draining_turns.v);
		let $A = null;
		if ($z[0] === 0) {
			const draining = $z[1];
			$A = enqueue(draining, __clone(self[1].v));
		} else {
			for (const subscriber of __clone(self[1].v)) {
				if (subscriber[2].v) {
					subscriber[1]();
				}
			}
			$A = undefined;
		}
		$y = $A;
	}
	return $y;
}
function $v(self, value, $h) {
	self[0].v = __clone(value);
	$w(self, $h);
}
function $B(self) {
	return __clone(self[0].v);
}
function $I(self, value, $h) {
	self[0].v = __clone(value);
	$w(self, $h);
}
function $U(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry[0]));
	}
	return result;
}
function $V(self, key) {
	const $W = __map_get(self[0], hash(key));
	let $X = null;
	if ($W[0] === 0) {
		const entry = $W[1];
		$X = [ 0, __clone(entry.slice(1, 3)) ];
	} else {
		$X = [ 1 ];
	}
	return $X;
}
function $ac(self, key) {
	self[0].delete(hash(key));
}
function $ad(self, key, value) {
	self[0].set(hash(key), [ __clone(key), ...__clone(value) ]);
}
function $ae(self) {
	let result = [  ];
	for (const entry of __map_values(self[0])) {
		result.push(__clone(entry.slice(1, 3)));
	}
	return result;
}
function $ag(self, name, value, $ah, $ai) {
	apply(value, self, name, $ah, $ai);
	return __clone(self);
}
function $aj(self, content, $ak, $al) {
	place(content, self, $ak, $al);
	return __clone(self);
}
function $am(self, content, $ak, $al) {
	place2(content, self, $ak, $al);
	return __clone(self);
}
function $aq(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[5].v = true;
	return result;
}
function $aw(self, transform) {
	return [ self, transform ];
}
function $aP(signal, subscriber) {
	const handle = [ signal[1], subscriber[0], subscriber[2], __shared_new([ 1 ]) ];
	signal[1].v.push(reissued(subscriber));
	return handle;
}
function $aO(self, subscriber) {
	return $aP(self, subscriber);
}
function $aN(self) {
	return [ () => {
		return $B(self);
	}, (subscriber) => {
		return $aO(self, subscriber);
	}, () => {
		return;
	} ];
}
function $bk(self) {
	const $bl = self;
	return $bl[0] === 1;
}
function $be(runs, body) {
	const run2 = renew(runs);
	const $bv = nursery(run2);
	let $bw = null;
	if ($bv[0] === 0) {
		const nursery2 = $bv[1];
		$bw = (($bx) => {
			return (($by) => {
				return body($by, $bx);
			})(nursery2);
		})(run2);
	} else {
		$bw = (() => {
			throw "a renewed run carries its nursery";
		})();
	}
	return $bw;
}
function $aX(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = $be(runs, ($bb, $bc) => {
		return (($bd) => {
			return body($bb, $bc, $bd);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function $aT(runs, tracker, body) {
	let value = $aX(runs, tracker, ($aU, $aV, $aW) => {
		return body($aU, $aV, $aW);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = $aX(runs, tracker, ($bZ, $ca, $cb) => {
			return body($bZ, $ca, $cb);
		});
		rounds = rounds + 1;
	}
	if (tracker[0].v[4]) {
		tracker[0].v[4] = false;
	}
	return value;
}
function $aM(self) {
	const transform = self[1];
	const upstream = $aN(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return $aT(runs, tracker, ($aQ, $aR, $aS) => {
			return transform(value, $aQ, $aR, $aS);
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
function $aL(flow, observer, immediately) {
	const instance = $aM(flow);
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
function $aK(self, observer) {
	return $aL(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $ck(self, item, $cl) {
	defer(self, () => {
		dispose(item, $cl);
		return;
	});
	return __clone(item);
}
function $aH(flow, observer, $aI, $aJ) {
	$ck(get_owner($aJ), $aK(flow, observer), $aI);
}
function $aB(flow, parent, $aC, $aD) {
	const node = document.createTextNode("");
	parent[0].appendChild(node);
	defer(get_owner($aD), () => {
		return node.remove();
	});
	$aH(flow, (value, $aG) => {
		node.textContent = value;
		return;
	}, $aC, $aD);
}
function $ay(self, parent, $az, $aA) {
	$aB(self, parent, $az, $aA);
}
function $ax(self, content, $ak, $al) {
	$ay(content, self, $ak, $al);
	return __clone(self);
}
function $cw(signal, observer) {
	const cell = signal[0];
	return $aP(signal, mint_subscriber(() => {
		const $cx = [ 0, cell ];
		let $cy = null;
		if ($cx[0] === 0) {
			const live = $cx[1];
			$cy = observer(live.v);
		} else {
			$cy = undefined;
		}
		return $cy;
	}));
}
function $cv(self, observer, immediately) {
	const subscription = $cw(self, observer);
	if (immediately) {
		observer($B(self));
	}
	return subscription;
}
function $cu(self, observer) {
	return $cv(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $ct(flow, observer, $aI, $aJ) {
	$ck(get_owner($aJ), $cu(flow, observer), $aI);
}
function $cp(self, condition, $cq, $cr) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	$ct(condition, (visible, $cs) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $cq, $cr);
	return __clone(self);
}
function $cM(self, observer, immediately) {
	const subscription = $cw(self, observer);
	if (immediately) {
		observer($B(self));
	}
	return subscription;
}
function $cL(self, observer) {
	return $cM(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $cK(flow, observer, $aI, $aJ) {
	$ck(get_owner($aJ), $cL(flow, observer), $aI);
}
function $cJ(flow, parent, $aC, $aD) {
	const node = document.createTextNode("");
	parent[0].appendChild(node);
	defer(get_owner($aD), () => {
		return node.remove();
	});
	$cK(flow, (value, $aG) => {
		node.textContent = value;
		return;
	}, $aC, $aD);
}
function $cI(self, parent, $az, $aA) {
	$cJ(self, parent, $az, $aA);
}
function $cH(self, content, $ak, $al) {
	$cI(content, self, $ak, $al);
	return __clone(self);
}
function $di(runs, body) {
	const run2 = renew(runs);
	const $dj = nursery(run2);
	let $dk = null;
	if ($dj[0] === 0) {
		const nursery2 = $dj[1];
		$dk = (($bx) => {
			return (($by) => {
				return body($by, $bx);
			})(nursery2);
		})(run2);
	} else {
		$dk = (() => {
			throw "a renewed run carries its nursery";
		})();
	}
	return $dk;
}
function $dh(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = $di(runs, ($bb, $bc) => {
		return (($bd) => {
			return body($bb, $bc, $bd);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function $dg(runs, tracker, body) {
	let value = $dh(runs, tracker, ($aU, $aV, $aW) => {
		return body($aU, $aV, $aW);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = $dh(runs, tracker, ($bZ, $ca, $cb) => {
			return body($bZ, $ca, $cb);
		});
		rounds = rounds + 1;
	}
	if (tracker[0].v[4]) {
		tracker[0].v[4] = false;
	}
	return value;
}
function $df(self) {
	const transform = self[1];
	const upstream = $aN(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return $dg(runs, tracker, ($aQ, $aR, $aS) => {
			return transform(value, $aQ, $aR, $aS);
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
function $de(flow, observer, immediately) {
	const instance = $df(flow);
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
function $dd(self, observer) {
	return $de(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $dc(flow, observer, $aI, $aJ) {
	$ck(get_owner($aJ), $dd(flow, observer), $aI);
}
function $db(self, condition, $cq, $cr) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	$dc(condition, (visible, $cs) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $cq, $cr);
	return __clone(self);
}
function $dD(self, subscriber) {
	return $aP(self, subscriber);
}
function $dB(self) {
	return [ () => {
		return $B(self);
	}, (subscriber) => {
		return $dD(self, subscriber);
	}, () => {
		return;
	} ];
}
function $dA(self) {
	const transform = self[1];
	const upstream = $dB(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return $dg(runs, tracker, ($aQ, $aR, $aS) => {
			return transform(value, $aQ, $aR, $aS);
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
function $dz(flow, observer, immediately) {
	const instance = $dA(flow);
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
function $dy(self, observer) {
	return $dz(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $dx(flow, observer, $aI, $aJ) {
	$ck(get_owner($aJ), $dy(flow, observer), $aI);
}
function $dw(self, condition, $cq, $cr) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	$dx(condition, (visible, $cs) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $cq, $cr);
	return __clone(self);
}
function $dQ(self, content, $ak, $al) {
	place3(content, self, $ak, $al);
	return __clone(self);
}
function $dT(source, key, render) {
	return [ source, key, render ];
}
function $ec(held, at, count) {
	if (at === 0 && count === held.v.length) {
		const run2 = __clone(held.v);
		return run2;
	}
	let span = [  ];
	let index = at;
	while (index < at + count) {
		span.push(__clone(__at(held.v, index)));
		index = index + 1;
	}
	return span;
}
function $eg(old_keys, old_items, items, key_of, same) {
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
		const canonical = hash2(__at(old_keys, build));
		__at_put(next_same, build, __map_get(first, canonical));
		first.set(canonical, build);
	}
	let steps = [  ];
	for (const item of items) {
		const item_key = key_of(item);
		const canonical2 = hash2(item_key);
		let head = __map_get(first, canonical2);
		let advancing = true;
		while (advancing) {
			const $eh = head;
			let $ei = null;
			if ($eh[0] === 0) {
				const at = $eh[1];
				if (__at(claimed, at)) {
					head = __at(next_same, at);
				} else {
					advancing = false;
				}
				$ei = undefined;
			} else {
				$ei = advancing = false;
			}
			$ei;
		}
		const $ej = head;
		let $ek = null;
		if ($ej[0] === 0) {
			const at2 = $ej[1];
			$ek = first.set(canonical2, at2);
		} else {
			$ek = first.delete(canonical2);
		}
		$ek;
		let found = [ 1 ];
		let walk = head;
		let walking = true;
		while (walking) {
			const $el = walk;
			let $em = null;
			if ($el[0] === 0) {
				const at3 = $el[1];
				if (!(__at(claimed, at3)) && __at(old_keys, at3) === item_key) {
					found = [ 0, at3 ];
					walking = false;
				} else {
					walk = __at(next_same, at3);
				}
				$em = undefined;
			} else {
				$em = walking = false;
			}
			$em;
		}
		let step = [ 2 ];
		const $en = found;
		if ($en[0] === 0) {
			__at_put(claimed, $en[1], true);
			let $eo = null;
			if (same(__at(old_items, $en[1]), item)) {
				$eo = [ 0, $en[1] ];
			} else {
				$eo = [ 1, $en[1] ];
			}
			step = $eo;
		}
		steps.push(step);
	}
	let removed = [  ];
	let index = 0;
	while (index < held) {
		if (!(__at(claimed, index))) {
			removed.push(index);
		}
		index = index + 1;
	}
	return [ steps, removed ];
}
function $ez(self) {
	let result = [  ];
	let index = self.length;
	while (index > 0) {
		index = index - 1;
		result.push(__clone(__at(self, index)));
	}
	return result;
}
function $eW(self, content, end, $eX, $eY) {
	const marker = document.createTextNode("");
	host(self).insertBefore(marker, end);
	const staging = document.createDocumentFragment();
	place(content, [ __clone(staging) ], $eX, $eY);
	host(self).insertBefore(staging, end);
	return [ marker ];
}
function $eZ(owner, body) {
	return body(owner);
}
function $ff(self) {
	return [ 1 ];
}
function $fi(self, cursor) {
	let none = [  ];
	return none;
}
function $fj(self, cursor) {

}
function $fe(self) {
	const $fg = $ff(self);
	let $fh = null;
	if ($fg[0] === 0) {
		const cursor = $fg[1];
		$fh = [ () => {
			return $B(self);
		}, (subscriber) => {
			return $dD(self, subscriber);
		}, () => {
			return $fi(self, cursor);
		}, () => {
			return $fj(self, cursor);
		} ];
	} else {
		$fh = [ () => {
			return $B(self);
		}, (subscriber) => {
			return $dD(self, subscriber);
		}, () => {
			return [ [ 2, $B(self) ] ];
		}, () => {
			return;
		} ];
	}
	return $fh;
}
function $fk(ops) {
	let last = [ 1 ];
	let index = 0;
	for (const op of ops) {
		const $fl = op;
		let $fm = null;
		if ($fl[0] === 2) {
			const _items = $fl[1];
			last = [ 0, index ];
			$fm = undefined;
		} else {
			$fm = undefined;
		}
		$fm;
		index = index + 1;
	}
	const $fn = last;
	let $fo = null;
	if ($fn[0] === 0 && $fn[1] > 0) {
		$fo = $fn[1];
	} else {
		return __clone(ops);
	}
	const from = $fo;
	let live = [  ];
	index = from;
	while (index < ops.length) {
		live.push(__at(ops, index));
		index = index + 1;
	}
	return live;
}
function $dY(parent, source, key, render, $dZ, $ea) {
	const region = open(parent);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_cells = __shared_new([  ]);
	const row_rows = region[2];
	const row_owners = __shared_new([  ]);
	defer(get_owner($ea), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		close(region);
		return;
	});
	const reconcile_span = (at, count, list) => {
		const whole = at === 0 && count === row_rows.v.length;
		const previous_cells = $ec(row_cells, at, count);
		const previous_rows = $ec(row_rows, at, count);
		const previous_owners = $ec(row_owners, at, count);
		let $ef = null;
		if (at + count < row_rows.v.length) {
			$ef = __at(row_rows.v, at + count)[0];
		} else {
			$ef = region[0];
		}
		const boundary = __clone($ef);
		const same = (_before, _after) => {
			return true;
		};
		let $ep = null;
		if (whole) {
			$ep = $eg(__clone(row_keys.v), __clone(row_items.v), list, key, same);
		} else {
			$ep = $eg($ec(row_keys, at, count), $ec(row_items, at, count), list, key, same);
		}
		const plan = $ep;
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
			let $eG = null;
			if (__at(settled, settled_at)) {
				const $eE = step;
				let $eF = null;
				if ($eE[0] === 0) {
					const index = $eE[1];
					__at_put(staying, index, true);
					$eF = undefined;
				} else {
					$eF = undefined;
				}
				$eG = $eF;
			}
			$eG;
			settled_at = settled_at + 1;
		}
		let cut = [  ];
		let index2 = 0;
		for (const row of previous_rows) {
			if (__at(staying, index2)) {
				cut.push([ 1 ]);
			} else {
				let $eH = null;
				if (index2 + 1 < previous_rows.length) {
					$eH = __at(previous_rows, index2 + 1)[0];
				} else {
					$eH = boundary;
				}
				const end = __clone($eH);
				cut.push([ 0, cut_row(region, row, end) ]);
			}
			index2 = index2 + 1;
		}
		for (const gone of plan[1]) {
			dispose2(__at(previous_owners, gone));
			drop_row(region, __at(previous_rows, gone));
		}
		let next_cells = [  ];
		let next_rows = [  ];
		let next_owners = [  ];
		let position = 0;
		for (const step2 of plan[0]) {
			const item = __clone(__at(list, position));
			const reference = __clone(__at(references, position));
			const $eI = step2;
			let $eJ = null;
			if ($eI[0] === 0) {
				const kept = $eI[1];
				const cell = __clone(__at(previous_cells, kept));
				$I(cell, item, $dZ);
				next_cells.push(cell);
				const $eQ = __at(cut, kept);
				let $eR = null;
				if ($eQ[0] === 0) {
					const content = __clone($eQ[1]);
					insert_row(region, __at(previous_rows, kept), content, reference);
					$eR = undefined;
				} else {
					$eR = undefined;
				}
				$eR;
				next_rows.push(__clone(__at(previous_rows, kept)));
				next_owners.push(__clone(__at(previous_owners, kept)));
				$eJ = undefined;
			} else if ($eI[0] === 1) {
				const kept2 = $eI[1];
				const cell2 = __clone(__at(previous_cells, kept2));
				$I(cell2, item, $dZ);
				next_cells.push(cell2);
				const $eS = __at(cut, kept2);
				let $eT = null;
				if ($eS[0] === 0) {
					const content2 = __clone($eS[1]);
					insert_row(region, __at(previous_rows, kept2), content2, reference);
					$eT = undefined;
				} else {
					$eT = undefined;
				}
				$eT;
				next_rows.push(__clone(__at(previous_rows, kept2)));
				next_owners.push(__clone(__at(previous_owners, kept2)));
				$eJ = undefined;
			} else {
				const cell3 = $b(item);
				const owner = new3();
				next_cells.push(__clone(cell3));
				next_rows.push($eZ(owner, ($eV) => {
					return $eW(region, render(cell3, $eV), reference, $dZ, $eV);
				}));
				next_owners.push(owner);
				$eJ = undefined;
			}
			$eJ;
			position = position + 1;
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		let $fa = null;
		if (whole) {
			hold_rows(region, next_rows);
			row_keys.v = next_keys;
			row_items.v = __clone(list);
			row_cells.v = next_cells;
			row_owners.v = next_owners;
		} else {
			let taken = 0;
			while (taken < count) {
				__remove_at(row_rows.v, at);
				__remove_at(row_owners.v, at);
				__remove_at(row_cells.v, at);
				__remove_at(row_keys.v, at);
				__remove_at(row_items.v, at);
				taken = taken + 1;
			}
			let offset = 0;
			while (offset < next_rows.length) {
				__insert_at(row_rows.v, at + offset, __clone(__at(next_rows, offset)));
				__insert_at(row_owners.v, at + offset, __clone(__at(next_owners, offset)));
				__insert_at(row_cells.v, at + offset, __clone(__at(next_cells, offset)));
				__insert_at(row_keys.v, at + offset, __clone(__at(next_keys, offset)));
				__insert_at(row_items.v, at + offset, __clone(__at(list, offset)));
				offset = offset + 1;
			}
			$fa = undefined;
		}
		return $fa;
	};
	const reconcile_pass = (list) => {
		return reconcile_span(0, row_rows.v.length, list);
	};
	const splice_rows = (at, removed, inserted) => {
		let taken = 0;
		while (taken < removed) {
			let $fb = null;
			if (at + 1 < row_rows.v.length) {
				$fb = __at(row_rows.v, at + 1)[0];
			} else {
				$fb = region[0];
			}
			const end = __clone($fb);
			const going = __clone(__at(row_rows.v, at));
			cut_row(region, going, end);
			dispose2(__at(row_owners.v, at));
			drop_row(region, going);
			__remove_at(row_rows.v, at);
			__remove_at(row_owners.v, at);
			__remove_at(row_cells.v, at);
			__remove_at(row_keys.v, at);
			__remove_at(row_items.v, at);
			taken = taken + 1;
		}
		let $fc = null;
		if (at < row_rows.v.length) {
			$fc = __at(row_rows.v, at)[0];
		} else {
			$fc = region[0];
		}
		const reference = __clone($fc);
		let offset = 0;
		for (const item of inserted) {
			const cell = $b(__clone(item));
			const owner = new3();
			const row = $eZ(owner, ($fd) => {
				return $eW(region, render(cell, $fd), reference, $dZ, $fd);
			});
			__insert_at(row_rows.v, at + offset, row);
			__insert_at(row_owners.v, at + offset, owner);
			__insert_at(row_cells.v, at + offset, __clone(cell));
			__insert_at(row_keys.v, at + offset, key(item));
			__insert_at(row_items.v, at + offset, __clone(item));
			offset = offset + 1;
		}
		return;
	};
	const instance = $fe(source);
	const drain2 = instance[2];
	const handle = instance[1](subscriber_of(() => {
		for (const op of $fk(drain2())) {
			const $fp = op;
			let $fq = null;
			if ($fp[0] === 0) {
				const at = $fp[1];
				const removed = $fp[2];
				const inserted = $fp[3];
				if (removed.length === 0 || inserted.length === 0) {
					splice_rows(at, removed.length, inserted);
				} else {
					reconcile_span(at, removed.length, inserted);
				}
				$fq = undefined;
			} else if ($fp[0] === 1) {
				const at2 = $fp[1];
				const _was = $fp[2];
				const value = $fp[3];
				const $fr = __list_get(row_keys.v, at2);
				let $fs = null;
				if ($fr[0] === 0) {
					const held = $fr[1];
					$fs = key(value) === held;
				} else {
					$fs = false;
				}
				const same_key = $fs;
				let $fv = null;
				if (same_key) {
					const $ft = __list_get(row_cells.v, at2);
					let $fu = null;
					if ($ft[0] === 0) {
						const cell = $ft[1];
						__at_put(row_items.v, at2, __clone(value));
						$I(cell, value, $dZ);
						$fu = undefined;
					} else {
						$fu = undefined;
					}
					$fv = $fu;
				} else {
					splice_rows(at2, 1, [ __clone(value) ]);
				}
				$fq = $fv;
			} else if ($fp[0] === 2) {
				const items = $fp[1];
				$fq = reconcile_pass(items);
			} else {
				const from = $fp[1];
				const count = $fp[2];
				const to = $fp[3];
				let moved = __clone(row_items.v);
				let lifted = [  ];
				let taken = 0;
				while (taken < count) {
					lifted.push(__remove_at(moved, from));
					taken = taken + 1;
				}
				let offset = 0;
				for (const item of lifted) {
					__insert_at(moved, to + offset, __clone(item));
					offset = offset + 1;
				}
				reconcile_pass(moved);
				$fq = undefined;
			}
			$fq;
		}
		return;
	}, false));
	also_releasing(handle, instance[3]);
	$ck(get_owner($ea), handle, $dZ);
	reconcile_pass(instance[0]());
}
function $dV(self, parent, $dW, $dX) {
	$dY(parent, __clone(self[0]), self[1], self[2], $dW, $dX);
}
function $dU(self, content, $ak, $al) {
	$dV(content, self, $ak, $al);
	return __clone(self);
}
function $fF(self) {
	return [ () => {
		return $B(self);
	}, (subscriber) => {
		return $dD(self, subscriber);
	}, () => {
		return;
	} ];
}
function $fE(self) {
	const transform = self[1];
	const upstream = $fF(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return $dg(runs, tracker, ($aQ, $aR, $aS) => {
			return transform(value, $aQ, $aR, $aS);
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
function $fD(flow, observer, immediately) {
	const instance = $fE(flow);
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
function $fC(self, observer) {
	return $fD(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $fB(flow, observer, $aI, $aJ) {
	$ck(get_owner($aJ), $fC(flow, observer), $aI);
}
function $fA(self, condition, $cq, $cr) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	$fB(condition, (visible, $cs) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $cq, $cr);
	return __clone(self);
}
function $gA(self) {
	const $gC = $ff(self);
	let $gD = null;
	if ($gC[0] === 0) {
		const cursor = $gC[1];
		$gD = [ () => {
			return $B(self);
		}, (subscriber) => {
			return $dD(self, subscriber);
		}, () => {
			return $fi(self, cursor);
		}, () => {
			return $fj(self, cursor);
		} ];
	} else {
		$gD = [ () => {
			return $B(self);
		}, (subscriber) => {
			return $dD(self, subscriber);
		}, () => {
			return [ [ 2, $B(self) ] ];
		}, () => {
			return;
		} ];
	}
	return $gD;
}
function $fS(parent, source, key, render, $dZ, $ea) {
	const region = open(parent);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_cells = __shared_new([  ]);
	const row_rows = region[2];
	const row_owners = __shared_new([  ]);
	defer(get_owner($ea), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		close(region);
		return;
	});
	const reconcile_span = (at, count, list) => {
		const whole = at === 0 && count === row_rows.v.length;
		const previous_cells = $ec(row_cells, at, count);
		const previous_rows = $ec(row_rows, at, count);
		const previous_owners = $ec(row_owners, at, count);
		let $fU = null;
		if (at + count < row_rows.v.length) {
			$fU = __at(row_rows.v, at + count)[0];
		} else {
			$fU = region[0];
		}
		const boundary = __clone($fU);
		const same = (_before, _after) => {
			return true;
		};
		let $ge = null;
		if (whole) {
			$ge = $eg(__clone(row_keys.v), __clone(row_items.v), list, key, same);
		} else {
			$ge = $eg($ec(row_keys, at, count), $ec(row_items, at, count), list, key, same);
		}
		const plan = $ge;
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
			let $gi = null;
			if (__at(settled, settled_at)) {
				const $gg = step;
				let $gh = null;
				if ($gg[0] === 0) {
					const index = $gg[1];
					__at_put(staying, index, true);
					$gh = undefined;
				} else {
					$gh = undefined;
				}
				$gi = $gh;
			}
			$gi;
			settled_at = settled_at + 1;
		}
		let cut = [  ];
		let index2 = 0;
		for (const row of previous_rows) {
			if (__at(staying, index2)) {
				cut.push([ 1 ]);
			} else {
				let $gj = null;
				if (index2 + 1 < previous_rows.length) {
					$gj = __at(previous_rows, index2 + 1)[0];
				} else {
					$gj = boundary;
				}
				const end = __clone($gj);
				cut.push([ 0, cut_row(region, row, end) ]);
			}
			index2 = index2 + 1;
		}
		for (const gone of plan[1]) {
			dispose2(__at(previous_owners, gone));
			drop_row(region, __at(previous_rows, gone));
		}
		let next_cells = [  ];
		let next_rows = [  ];
		let next_owners = [  ];
		let position = 0;
		for (const step2 of plan[0]) {
			const item = __clone(__at(list, position));
			const reference = __clone(__at(references, position));
			const $gk = step2;
			let $gl = null;
			if ($gk[0] === 0) {
				const kept = $gk[1];
				const cell = __clone(__at(previous_cells, kept));
				$I(cell, item, $dZ);
				next_cells.push(cell);
				const $gs = __at(cut, kept);
				let $gt = null;
				if ($gs[0] === 0) {
					const content = __clone($gs[1]);
					insert_row(region, __at(previous_rows, kept), content, reference);
					$gt = undefined;
				} else {
					$gt = undefined;
				}
				$gt;
				next_rows.push(__clone(__at(previous_rows, kept)));
				next_owners.push(__clone(__at(previous_owners, kept)));
				$gl = undefined;
			} else if ($gk[0] === 1) {
				const kept2 = $gk[1];
				const cell2 = __clone(__at(previous_cells, kept2));
				$I(cell2, item, $dZ);
				next_cells.push(cell2);
				const $gu = __at(cut, kept2);
				let $gv = null;
				if ($gu[0] === 0) {
					const content2 = __clone($gu[1]);
					insert_row(region, __at(previous_rows, kept2), content2, reference);
					$gv = undefined;
				} else {
					$gv = undefined;
				}
				$gv;
				next_rows.push(__clone(__at(previous_rows, kept2)));
				next_owners.push(__clone(__at(previous_owners, kept2)));
				$gl = undefined;
			} else {
				const cell3 = $b(item);
				const owner = new3();
				next_cells.push(__clone(cell3));
				next_rows.push($eZ(owner, ($eV) => {
					return $eW(region, render(cell3, $eV), reference, $dZ, $eV);
				}));
				next_owners.push(owner);
				$gl = undefined;
			}
			$gl;
			position = position + 1;
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		let $gx = null;
		if (whole) {
			hold_rows(region, next_rows);
			row_keys.v = next_keys;
			row_items.v = __clone(list);
			row_cells.v = next_cells;
			row_owners.v = next_owners;
		} else {
			let taken = 0;
			while (taken < count) {
				__remove_at(row_rows.v, at);
				__remove_at(row_owners.v, at);
				__remove_at(row_cells.v, at);
				__remove_at(row_keys.v, at);
				__remove_at(row_items.v, at);
				taken = taken + 1;
			}
			let offset = 0;
			while (offset < next_rows.length) {
				__insert_at(row_rows.v, at + offset, __clone(__at(next_rows, offset)));
				__insert_at(row_owners.v, at + offset, __clone(__at(next_owners, offset)));
				__insert_at(row_cells.v, at + offset, __clone(__at(next_cells, offset)));
				__insert_at(row_keys.v, at + offset, __clone(__at(next_keys, offset)));
				__insert_at(row_items.v, at + offset, __clone(__at(list, offset)));
				offset = offset + 1;
			}
			$gx = undefined;
		}
		return $gx;
	};
	const reconcile_pass = (list) => {
		return reconcile_span(0, row_rows.v.length, list);
	};
	const splice_rows = (at, removed, inserted) => {
		let taken = 0;
		while (taken < removed) {
			let $gy = null;
			if (at + 1 < row_rows.v.length) {
				$gy = __at(row_rows.v, at + 1)[0];
			} else {
				$gy = region[0];
			}
			const end = __clone($gy);
			const going = __clone(__at(row_rows.v, at));
			cut_row(region, going, end);
			dispose2(__at(row_owners.v, at));
			drop_row(region, going);
			__remove_at(row_rows.v, at);
			__remove_at(row_owners.v, at);
			__remove_at(row_cells.v, at);
			__remove_at(row_keys.v, at);
			__remove_at(row_items.v, at);
			taken = taken + 1;
		}
		let $gz = null;
		if (at < row_rows.v.length) {
			$gz = __at(row_rows.v, at)[0];
		} else {
			$gz = region[0];
		}
		const reference = __clone($gz);
		let offset = 0;
		for (const item of inserted) {
			const cell = $b(__clone(item));
			const owner = new3();
			const row = $eZ(owner, ($fd) => {
				return $eW(region, render(cell, $fd), reference, $dZ, $fd);
			});
			__insert_at(row_rows.v, at + offset, row);
			__insert_at(row_owners.v, at + offset, owner);
			__insert_at(row_cells.v, at + offset, __clone(cell));
			__insert_at(row_keys.v, at + offset, key(item));
			__insert_at(row_items.v, at + offset, __clone(item));
			offset = offset + 1;
		}
		return;
	};
	const instance = $gA(source);
	const drain2 = instance[2];
	const handle = instance[1](subscriber_of(() => {
		for (const op of $fk(drain2())) {
			const $gL = op;
			let $gM = null;
			if ($gL[0] === 0) {
				const at = $gL[1];
				const removed = $gL[2];
				const inserted = $gL[3];
				if (removed.length === 0 || inserted.length === 0) {
					splice_rows(at, removed.length, inserted);
				} else {
					reconcile_span(at, removed.length, inserted);
				}
				$gM = undefined;
			} else if ($gL[0] === 1) {
				const at2 = $gL[1];
				const _was = $gL[2];
				const value = $gL[3];
				const $gN = __list_get(row_keys.v, at2);
				let $gO = null;
				if ($gN[0] === 0) {
					const held = $gN[1];
					$gO = key(value) === held;
				} else {
					$gO = false;
				}
				const same_key = $gO;
				let $gR = null;
				if (same_key) {
					const $gP = __list_get(row_cells.v, at2);
					let $gQ = null;
					if ($gP[0] === 0) {
						const cell = $gP[1];
						__at_put(row_items.v, at2, __clone(value));
						$I(cell, value, $dZ);
						$gQ = undefined;
					} else {
						$gQ = undefined;
					}
					$gR = $gQ;
				} else {
					splice_rows(at2, 1, [ __clone(value) ]);
				}
				$gM = $gR;
			} else if ($gL[0] === 2) {
				const items = $gL[1];
				$gM = reconcile_pass(items);
			} else {
				const from = $gL[1];
				const count = $gL[2];
				const to = $gL[3];
				let moved = __clone(row_items.v);
				let lifted = [  ];
				let taken = 0;
				while (taken < count) {
					lifted.push(__remove_at(moved, from));
					taken = taken + 1;
				}
				let offset = 0;
				for (const item of lifted) {
					__insert_at(moved, to + offset, __clone(item));
					offset = offset + 1;
				}
				reconcile_pass(moved);
				$gM = undefined;
			}
			$gM;
		}
		return;
	}, false));
	also_releasing(handle, instance[3]);
	$ck(get_owner($ea), handle, $dZ);
	reconcile_pass(instance[0]());
}
function $fR(self, parent, $dW, $dX) {
	$fS(parent, __clone(self[0]), self[1], self[2], $dW, $dX);
}
function $fQ(self, content, $ak, $al) {
	$fR(content, self, $ak, $al);
	return __clone(self);
}
function $gT(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, scope ];
}
function $hf(self, transform, $hg) {
	$v(self, transform($B(self)), $hg);
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
const status = $a("Loading the compiler\u{2026}");
const diagnostics = $c([  ]);
const console_lines = $c([  ]);
const can_format = $c(false);
const can_platform = $c(false);
const can_prelude = $c(false);
const mode = $a("browser");
const share_label = $a("Share");
const next_row_id = __shared_new(0);
const modified_from = $a("");
const buffer_dirty = __shared_new(false);
const run_token = __shared_new("");
const confirm_target = $a("");
const run = () => {
	if (VilanPlayground.compile(VilanPlayground.value())) {
		$g(status, "Compiling\u{2026}", [ 1 ]);
	} else {
		$g(status, "Compiler busy; queued.", [ 1 ]);
	}
	return;
};
const format = () => {
	if (!(VilanPlayground.format())) {
		$g(status, "Compiler busy; try again.", [ 1 ]);
	}
	return;
};
const share = () => {
	return VilanPlayground.share();
};
const load_example = (name) => {
	const $t = name;
	let $u = null;
	if ($t === "server") {
		$u = "node";
	} else {
		$u = "browser";
	}
	const platform = $u;
	VilanPlayground.setMode(platform);
	VilanPlayground.setPrelude("on");
	VilanPlayground.setDoc(VilanPlayground.example(name));
	$v(diagnostics, [  ], [ 1 ]);
	$v(console_lines, [  ], [ 1 ]);
	run();
	return;
};
const pick = (name) => {
	if (buffer_dirty.v) {
		$g(confirm_target, name, [ 1 ]);
	} else {
		load_example(name);
	}
	return;
};
const confirm_replace = () => {
	const name = $B(confirm_target);
	$g(confirm_target, "", [ 1 ]);
	if (name !== "") {
		load_example(name);
	}
	return;
};
const cancel_replace = () => {
	return $g(confirm_target, "", [ 1 ]);
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
	$g(share_label, label, [ 1 ]);
	const $C = share_revert.v;
	let $D = null;
	if ($C[0] === 0) {
		const timer = $C[1];
		$D = cancel(timer);
	} else {
		$D = undefined;
	}
	$D;
	const timer2 = after(1600);
	share_revert.v = [ 0, __clone(timer2) ];
	__task(async () => {
		if (await (wait(timer2, [ 1 ]))) {
			$g(share_label, "Share", [ 1 ]);
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
	$I(diagnostics, rows, [ 1 ]);
	return rows.length;
};
mount_root("app", ($O) => {
	return playground_page(status, diagnostics, console_lines, can_format, can_platform, can_prelude, share_label, mode, modified_from, confirm_target, run, format, share, confirm_replace, cancel_replace, [ 1 ], $O);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $hc = null;
	if (kind === "ready") {
		$I(can_format, event.canFormat, [ 1 ]);
		$I(can_platform, event.canPlatform, [ 1 ]);
		if (!(event.canPlatform)) {
			VilanPlayground.setMode("browser");
		}
		$I(can_prelude, event.canPrelude, [ 1 ]);
		if (!(event.canPrelude)) {
			VilanPlayground.setPrelude("on");
		}
		$g(status, "Ready (vilan " + event.version + ")", [ 1 ]);
		compiler_ready.v = true;
		run_on_arrival();
	} else if (kind === "doc") {
		doc_ready.v = true;
		run_on_arrival();
	} else if (kind === "dirty") {
		buffer_dirty.v = event.changed;
		$g(modified_from, event.name, [ 1 ]);
		if (!(event.changed)) {
			$g(confirm_target, "", [ 1 ]);
		}
		$hc = undefined;
	} else if (kind === "command") {
		const command = event.command;
		if (command === "run") {
			run();
		} else if (command === "format") {
			format();
		} else if (command === "pick") {
			pick(event.name);
		} else if (command === "mode") {
			$g(mode, event.name, [ 1 ]);
		}
		$hc = undefined;
	} else if (kind === "formatted") {
		const declined = event.declined;
		if (declined !== "") {
			$g(status, "Format left the buffer unchanged \u{2014} " + declined, [ 1 ]);
		} else if (event.changed) {
			$g(status, "Formatted.", [ 1 ]);
		} else {
			$g(status, "Format made no changes.", [ 1 ]);
		}
		$hc = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			$g(status, "Link copied to the clipboard.", [ 1 ]);
			flash_share("Copied!");
		} else {
			$g(status, "Link ready in the address bar.", [ 1 ]);
			flash_share("Link ready");
		}
		$hc = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $hd = null;
		if (event.ok) {
			if (event.platform === "node") {
				$g(status, "No problems (server check, vilan " + event.version + ").", [ 1 ]);
			} else {
				$g(status, "No problems (vilan " + event.version + ").", [ 1 ]);
			}
			$hd = undefined;
		} else if (count === 1) {
			$g(status, "1 problem; see the diagnostics.", [ 1 ]);
		} else {
			$g(status, "" + count + " problems; see the diagnostics.", [ 1 ]);
		}
		$hc = $hd;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $he = null;
		if (event.platform === "node") {
			if (event.ok) {
				$g(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ]);
			} else {
				$g(status, "Build failed; see the diagnostics.", [ 1 ]);
			}
			$he = undefined;
		} else {
			$v(console_lines, [  ], [ 1 ]);
			if (event.ok) {
				$g(status, "Compiled (vilan " + event.version + ")", [ 1 ]);
				const token = crypto.randomUUID();
				run_token.v = token;
				VilanPlayground.runProgram(event.js, event.css, token);
			} else {
				$g(status, "Build failed; see the diagnostics.", [ 1 ]);
				run_token.v = "";
				VilanPlayground.clearProgram();
			}
			$he = undefined;
		}
		$hc = $he;
	} else if (kind === "crash") {
		$g(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $hc;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const expected = run_token.v;
	const kind = message.kind;
	if (expected !== "" && message.token === expected && (kind === "log" || kind === "error")) {
		$hf(console_lines, (lines) => {
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
