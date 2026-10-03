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
	const $bA = turn;
	let $bB = null;
	if ($bA[0] === 0) {
		const ambient = $bA[1];
		$bB = enqueue(ambient, [ reissued(subscriber) ]);
	} else {
		const $bC = $o(draining_turns.v);
		let $bD = null;
		if ($bC[0] === 0) {
			const draining = $bC[1];
			$bD = enqueue(draining, [ reissued(subscriber) ]);
		} else {
			if (subscriber[2].v) {
				subscriber[1]();
			}
			$bD = undefined;
		}
		$bB = $bD;
	}
	return $bB;
}
function reissued(subscriber) {
	return [ subscriber[0], subscriber[1], subscriber[2], subscriber[3] ];
}
function wake(subscriber) {
	defer_subscriber([ 1 ], subscriber);
}
function dispose(self, $cc) {
	const $cd = $cc;
	let $ce = null;
	if ($cd[0] === 0) {
		const established = $cd[1];
		$ce = [ 0, established ];
	} else {
		$ce = $o(draining_turns.v);
	}
	const ambient = $ce;
	release_under(self, ambient);
}
function detach(handle) {
	const $bH = $o(releasing_turns.v);
	let $bI = null;
	if ($bH[0] === 0) {
		const at_release = $bH[1];
		$bI = at_release;
	} else {
		$bI = $o(draining_turns.v);
	}
	const turn = $bI;
	release_under(handle, turn);
}
function release_under(handle, ambient) {
	handle[2].v = false;
	const $bJ = [ 0, handle[0] ];
	let $bK = null;
	if ($bJ[0] === 0) {
		const subscribers = $bJ[1];
		let kept = [  ];
		for (const subscriber of subscribers.v) {
			if (subscriber[0] !== handle[1]) {
				kept.push(__clone(subscriber));
			}
		}
		subscribers.v = kept;
		$bK = undefined;
	} else {
		$bK = undefined;
	}
	$bK;
	const $bL = ambient;
	let $bM = null;
	if ($bL[0] === 0) {
		const turn = $bL[1];
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
		$bM = undefined;
	} else {
		$bM = undefined;
	}
	$bM;
	const $bN = handle[3].v;
	let $bO = null;
	if ($bN[0] === 0) {
		const release = $bN[1];
		handle[3].v = [ 1 ];
		releasing_turns.v.push(ambient);
		__with_finally(release, () => {
			__list_pop(releasing_turns.v);
			return;
		});
		$bO = undefined;
	} else {
		$bO = undefined;
	}
	return $bO;
}
function new3() {
	return [ __shared_new([ 0, no_cleanups, false, [ 1 ] ]), 0 ];
}
function is_disposed(self) {
	return self[0].v[0] !== self[1];
}
function defer(self, cleanup) {
	let $cf = null;
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
		$cf = undefined;
	}
	return $cf;
}
function renew(self) {
	const $aV = self[0].v[3];
	let $aW = null;
	if ($aV[0] === 0) {
		const nursery2 = __clone($aV[1]);
		let $aX = null;
		if (has_spawned(nursery2)) {
			$aX = [ 1 ];
		} else {
			$aX = [ 0, nursery2 ];
		}
		$aW = $aX;
	} else {
		$aW = [ 1 ];
	}
	const carried = $aW;
	advance([ self[0], self[0].v[0] ], carried);
	if ($ba(self[0].v[3])) {
		run_nurseries_allocated_count.v = run_nurseries_allocated_count.v + 1;
		self[0].v[3] = [ 0, detached_nursery() ];
	}
	return [ self[0], self[0].v[0] ];
}
function nursery(self) {
	let $bk = null;
	if (is_disposed(self)) {
		$bk = [ 1 ];
	} else {
		$bk = self[0].v[3];
	}
	return $bk;
}
function dispose2(self) {
	advance(self, [ 1 ]);
}
function advance(self, carried) {
	let $bj = null;
	if (!(is_disposed(self))) {
		const held = self[0].v;
		self[0].v = [ self[1] + 1, no_cleanups, false, carried ];
		const $aY = held[3];
		let $aZ = null;
		if ($aY[0] === 0) {
			const nursery2 = $aY[1];
			if ($ba(carried)) {
				nursery2.cancel();
			}
			$aZ = undefined;
		} else {
			$aZ = undefined;
		}
		$aZ;
		let $bi = null;
		if (held[2]) {
			let failure = [ 1 ];
			for (const cleanup of held[1].v) {
				const $bc = __guarded(cleanup);
				let $bd = null;
				if ($bc[0] === 0) {
					const message = $bc[1];
					if ($ba(failure)) {
						failure = [ 0, message ];
					}
					$bd = undefined;
				} else {
					$bd = undefined;
				}
				$bd;
			}
			const $bg = failure;
			let $bh = null;
			if ($bg[0] === 0) {
				const message2 = $bg[1];
				$bh = (() => {
					throw message2;
				})();
			} else {
				$bh = undefined;
			}
			$bi = $bh;
		}
		$bj = $bi;
	}
	return $bj;
}
function get_owner($az) {
	return $az;
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
	const $aO = tracker[0].v[6];
	let $aP = null;
	if ($aO[0] === 0) {
		const lists = $aO[1];
		if (!($n(lists.v[0]))) {
			lists.v[0] = [  ];
		}
		$aP = undefined;
	} else {
		$aP = undefined;
	}
	$aP;
	return [ __clone(tracker), epoch ];
}
function close_run(tracker) {
	tracker[0].v[1] = false;
	const $bp = tracker[0].v[6];
	let $bq = null;
	if ($bp[0] === 0) {
		const lists = $bp[1];
		$bq = lists;
	} else {
		return;
		$bq = undefined;
	}
	const lists2 = $bq;
	const $br = tracker[0].v[5];
	let $bs = null;
	if ($br[0] === 0) {
		const target = __clone($br[1]);
		$bs = reconnect(tracker, lists2, target);
	} else {
		if (!($n(lists2.v[0])) || !($n(lists2.v[1]))) {
			lists2.v[1] = __clone(lists2.v[0]);
		}
		$bs = undefined;
	}
	$bs;
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
		const $by = reusable(held, kept, dependency[0], position);
		let $bz = null;
		if ($by[0] === 0) {
			const index = $by[1];
			__at_put(kept, index, true);
			next.push(__clone(__at(held, index)));
			$bz = undefined;
		} else {
			next.push([ dependency[0], dependency[1](relay_for(tracker, target)) ]);
			$bz = undefined;
		}
		$bz;
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
	const $bu = identity;
	let $bv = null;
	if ($bu[0] === 0) {
		const wanted = $bu[1];
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
		$bv = [ 1 ];
	} else {
		$bv = [ 1 ];
	}
	return $bv;
}
function same_identity(identity, wanted) {
	const $bw = identity;
	let $bx = null;
	if ($bw[0] === 0) {
		const held = $bw[1];
		$bx = held === wanted;
	} else {
		$bx = false;
	}
	return $bx;
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
	const $bS = tracker[0].v[6];
	let $bT = null;
	if ($bS[0] === 0) {
		const lists = $bS[1];
		$bT = lists;
	} else {
		return;
		$bT = undefined;
	}
	const lists2 = $bT;
	let $bU = null;
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
		$bU = undefined;
	}
	return $bU;
}
function forget_reads(tracker) {
	const $bV = tracker[0].v[6];
	let $bW = null;
	if ($bV[0] === 0) {
		const lists = $bV[1];
		$bW = lists;
	} else {
		return;
		$bW = undefined;
	}
	const lists2 = $bW;
	let $bX = null;
	if (!($n(lists2.v[2]))) {
		const edges = __clone(lists2.v[2]);
		lists2.v[2] = [  ];
		for (const edge of edges) {
			detach(edge[1]);
		}
		$bX = undefined;
	}
	$bX;
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
		const $bY = previous;
		let $bZ = null;
		if ($bY[0] === 0) {
			const earlier = $bY[1];
			$bZ = earlier();
		} else {
			$bZ = undefined;
		}
		return $bZ;
	} ];
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
function after(ms) {
	return [ __timer(ms) ];
}
async function wait(self, $E) {
	return await (self[0].wait(ambient_signal($E)));
}
function cancel(self) {
	self[0].cancel();
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
		return $cj([ 1 ], ($ci) => {
			return (() => {
				return handler($ci, [ 1 ]);
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
		let $dP = null;
		if (at + 1 < rows.length) {
			$dP = __at(rows, at + 1)[0];
		} else {
			$dP = self[0];
		}
		const end = __clone($dP);
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
function settled_steps(steps) {
	let forward = [  ];
	let forward_count = 0;
	let highest = [ 1 ];
	for (const step of steps) {
		const $eg = step;
		let $eh = null;
		if ($eg[0] === 0) {
			const index = $eg[1];
			const $ei = highest;
			let $ej = null;
			if ($ei[0] === 0) {
				const top = $ei[1];
				$ej = index > top;
			} else {
				$ej = true;
			}
			const rises = $ej;
			if (rises) {
				highest = [ 0, index ];
				forward_count = forward_count + 1;
				forward.push(true);
			} else {
				forward.push(false);
			}
			$eh = undefined;
		} else {
			forward.push(false);
			$eh = undefined;
		}
		$eh;
	}
	let backward = [  ];
	let backward_count = 0;
	let lowest = steps.length;
	let at = steps.length;
	while (at > 0) {
		at = at - 1;
		const $ek = __at(steps, at);
		let $el = null;
		if ($ek[0] === 0) {
			const index2 = $ek[1];
			if (index2 < lowest) {
				lowest = index2;
				backward_count = backward_count + 1;
				backward.push(true);
			} else {
				backward.push(false);
			}
			$el = undefined;
		} else {
			backward.push(false);
			$el = undefined;
		}
		$el;
	}
	let $em = null;
	if (forward_count >= backward_count) {
		$em = forward;
	} else {
		$em = $en(backward);
	}
	return $em;
}
function row_references(steps, rows, settled, anchor) {
	let references = [  ];
	let reference = __clone(anchor);
	let at = steps.length;
	while (at > 0) {
		at = at - 1;
		references.push(__clone(reference));
		let $eq = null;
		if (__at(settled, at)) {
			const $eo = __at(steps, at);
			let $ep = null;
			if ($eo[0] === 0) {
				const index = $eo[1];
				reference = __clone(__at(rows, index)[0]);
				$ep = undefined;
			} else {
				$ep = undefined;
			}
			$eq = $ep;
		}
		$eq;
	}
	return $en(references);
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
	const $gH = $cj([ 1 ], ($gE) => {
		return $gF(body);
	});
	const built = $gH[0];
	const root = $gH[1];
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
function template_option(value, label, $cw, $cx) {
	return text($ag(view("option"), "value", value, $cw, $cx), label);
}
function template_title(name) {
	const $cO = name;
	let $cP = null;
	if ($cO === "counter") {
		$cP = "Counter";
	} else if ($cO === "hello") {
		$cP = "Hello";
	} else if ($cO === "styles") {
		$cP = "Styles";
	} else if ($cO === "server") {
		$cP = "Server";
	} else {
		$cP = name;
	}
	return $cP;
}
function severity_tag(row) {
	const $dC = row[1];
	let $dD = null;
	if ($dC === "error") {
		$dD = text(styled(view("span"), diag_error), "error");
	} else {
		$dD = text(styled(view("span"), diag_warning), "warning");
	}
	return $dD;
}
function trace_row(hop) {
	let $dE = null;
	if (hop[4]) {
		$dE = "  via " + hop[0] + ":" + hop[1] + ":" + hop[2] + " \u{2014} " + hop[3];
	} else {
		$dE = "  " + hop[3];
	}
	const text2 = $dE;
	return text(styled(view("div"), diag_trace), text2);
}
function diagnostic_row(row, $dA, $dB) {
	const head = $aj($aj($aj(view("div"), severity_tag(row), $dA, $dB), text(styled(view("span"), diag_site), " " + row[2] + ":" + row[3] + ":" + row[4] + " "), $dA, $dB), text(view("span"), row[5]), $dA, $dB);
	let lines = [ head ];
	for (const hop of row[7]) {
		lines.push(trace_row(hop));
	}
	if (row[6] !== "") {
		lines.push(text(styled(view("div"), diag_note), "  note: " + row[6]));
	}
	const body = children(view("div"), lines);
	const $dF = row[1];
	let $dG = null;
	if ($dF === "error") {
		$dG = $aj(styled(view("div"), diag_row_error), body, $dA, $dB);
	} else {
		$dG = $aj(styled(view("div"), diag_row_warning), body, $dA, $dB);
	}
	return $dG;
}
function console_row(row) {
	const $fz = row[1];
	let $fA = null;
	if ($fz === "error") {
		$fA = text(styled(view("div"), console_error), row[2]);
	} else {
		$fA = text(styled(view("div"), console_line), row[2]);
	}
	return $fA;
}
function playground_page(status2, diagnostics2, console_lines2, can_format2, can_platform2, share_label2, mode2, modified_from2, confirm_target2, run2, format2, share2, confirm_replace2, cancel_replace2, $P, $Q) {
	return $aj($aj(styled(view("div"), add(add(shell, app_fill), code_palette)), $aj($aj($aj($aj($aj($aj($aj($aj($aj($aj($aj(styled(view("header"), app_bar), $aj($aj($ag(styled(view("a"), add(nav_brand, nav_link)), "href", "/", $P, $Q), $ag(styled(view("span"), add(nav_mark, no_drag)), "aria-hidden", "true", $P, $Q), $P, $Q), text(view("span"), "VILAN"), $P, $Q), $P, $Q), text(styled(view("h1"), page_title), "Playground"), $P, $Q), styled(view("div"), rail_divider), $P, $Q), on($as(styled(view("button"), primary_button), $ar(__clone(mode2), (current, $am, $an, $ao) => {
		const $ap = current;
		let $aq = null;
		if ($ap === "node") {
			$aq = "Check";
		} else {
			$aq = "Run";
		}
		return $aq;
	}), $P, $Q), "click", ($cg, $ch) => {
		return run2();
	}), $P, $Q), $aj($aj($ck($ag($ag(styled(view("select"), select_box), "id", "mode", $P, $Q), "aria-label", "Compile mode", $P, $Q), __clone(can_platform2), $P, $Q), template_option("browser", "Browser: compile and run", $P, $Q), $P, $Q), template_option("node", "Server: check the process leg", $P, $Q), $P, $Q), $P, $Q), $ck(on(text(styled(view("button"), ghost_button), "Format"), "click", ($cy, $cz) => {
		return format2();
	}), __clone(can_format2), $P, $Q), $P, $Q), on($cA(styled(view("button"), ghost_button), __clone(share_label2), $P, $Q), "click", ($cH, $cI) => {
		return share2();
	}), $P, $Q), $cA($ag(styled(view("p"), status_line), "role", "status", $P, $Q), __clone(status2), $P, $Q), $P, $Q), $ag($ag(styled(view("select"), version_select), "id", "version", $P, $Q), "aria-label", "Compiler version", $P, $Q), $P, $Q), styled(view("div"), rail_divider), $P, $Q), text($ag(styled(view("a"), nav_link), "href", "/docs/", $P, $Q), "Docs"), $P, $Q), $P, $Q), $aj($aj($aj($aj(styled(view("main"), quad_grid), $aj($aj($aj(styled(view("div"), panel), $aj($aj(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Program"), $P, $Q), $aj($aj($aj($aj($aj($ag($ag(styled(view("select"), select_box), "id", "template", $P, $Q), "aria-label", "Load an example", $P, $Q), $as($ag($ag($ag(view("option"), "value", "", $P, $Q), "disabled", "true", $P, $Q), "hidden", "true", $P, $Q), $ar(__clone(modified_from2), (name, $cJ, $cK, $cL) => {
		const $cM = name;
		let $cN = null;
		if ($cM === "") {
			$cN = "Examples";
		} else {
			$cN = "Modified \u{2014} " + template_title(name);
		}
		return $cN;
	}), $P, $Q), $P, $Q), template_option("counter", "Counter: reactive state", $P, $Q), $P, $Q), template_option("hello", "Hello: mount and print", $P, $Q), $P, $Q), template_option("styles", "Styles: compile-time CSS", $P, $Q), $P, $Q), $ck(template_option("server", "Server: typed HTTP, checked", $P, $Q), __clone(can_platform2), $P, $Q), $P, $Q), $P, $Q), $P, $Q), $aj($cU($ag(view("div"), "role", "alert", $P, $Q), $ar(__clone(confirm_target2), (name, $cQ, $cR, $cS) => {
		return name !== "";
	}), $P, $Q), $aj($aj($aj(styled(view("div"), confirm_bar), $as(styled(view("p"), confirm_question), $ar(__clone(confirm_target2), (name, $de, $df, $dg) => {
		return "Replace the current program with " + template_title(name) + "? The edits are not kept.";
	}), $P, $Q), $P, $Q), on(text(styled(view("button"), ghost_button), "Keep editing"), "click", ($dh, $di) => {
		return cancel_replace2();
	}), $P, $Q), on(text(styled(view("button"), primary_button), "Replace"), "click", ($dj, $dk) => {
		return confirm_replace2();
	}), $P, $Q), $P, $Q), $P, $Q), $ag($ag(styled(view("div"), editor_host), "id", "editor", $P, $Q), "aria-label", "Program editor", $P, $Q), $P, $Q), $P, $Q), $aj($aj(styled(view("div"), panel), $aj(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Result"), $P, $Q), $P, $Q), $ag($ag(styled(view("div"), runner_host), "id", "runner", $P, $Q), "aria-label", "Program result", $P, $Q), $P, $Q), $P, $Q), $aj($aj(styled(view("div"), panel), $aj(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Diagnostics"), $P, $Q), $P, $Q), $dI($aj(styled(view("pre"), report_well), $dp(text(styled(view("div"), quiet_row), "Nothing to report."), $ar(__clone(diagnostics2), (rows, $dl, $dm, $dn) => {
		return rows.length === 0;
	}), $P, $Q), $P, $Q), $dH(__clone(diagnostics2), (row) => {
		return row[0];
	}, (row, $dy) => {
		return diagnostic_row($B(row), $P, $dy);
	}), $P, $Q), $P, $Q), $P, $Q), $aj($aj(styled(view("div"), panel), $aj(styled(view("div"), panel_head), text(styled(view("p"), panel_title), "Console"), $P, $Q), $P, $Q), $fC($aj(styled(view("pre"), report_well), $fo(text(styled(view("div"), quiet_row), "Program output lands here."), $ar(__clone(console_lines2), (rows, $fk, $fl, $fm) => {
		return rows.length === 0;
	}), $P, $Q), $P, $Q), $dH(__clone(console_lines2), (row) => {
		return row[0];
	}, (row, $fx) => {
		return console_row($B(row));
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
function $ar(self, transform) {
	return [ self, transform ];
}
function $aF(signal, subscriber) {
	const handle = [ signal[1], subscriber[0], subscriber[2], __shared_new([ 1 ]) ];
	signal[1].v.push(reissued(subscriber));
	return handle;
}
function $aE(self, subscriber) {
	return $aF(self, subscriber);
}
function $aD(self) {
	return [ () => {
		return $B(self);
	}, (subscriber) => {
		return $aE(self, subscriber);
	}, () => {
		return;
	} ];
}
function $ba(self) {
	const $bb = self;
	return $bb[0] === 1;
}
function $aU(runs, body) {
	const run2 = renew(runs);
	const $bl = nursery(run2);
	let $bm = null;
	if ($bl[0] === 0) {
		const nursery2 = $bl[1];
		$bm = (($bn) => {
			return (($bo) => {
				return body($bn, $bo);
			})(nursery2);
		})(run2);
	} else {
		$bm = (() => {
			throw "a renewed run carries its nursery";
		})();
	}
	return $bm;
}
function $aN(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = $aU(runs, ($aR, $aS) => {
		return (($aT) => {
			return body($aR, $aT, $aS);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function $aJ(runs, tracker, body) {
	let value = $aN(runs, tracker, ($aK, $aL, $aM) => {
		return body($aK, $aL, $aM);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = $aN(runs, tracker, ($bP, $bQ, $bR) => {
			return body($bP, $bQ, $bR);
		});
		rounds = rounds + 1;
	}
	if (tracker[0].v[4]) {
		tracker[0].v[4] = false;
	}
	return value;
}
function $aC(self) {
	const transform = self[1];
	const upstream = $aD(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return $aJ(runs, tracker, ($aG, $aH, $aI) => {
			return transform(value, $aG, $aH, $aI);
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
function $aB(flow, observer, immediately) {
	const instance = $aC(flow);
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
function $aA(self, observer) {
	return $aB(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $ca(self, item, $cb) {
	defer(self, () => {
		dispose(item, $cb);
		return;
	});
	return __clone(item);
}
function $aw(flow, observer, $ax, $ay) {
	$ca(get_owner($ay), $aA(flow, observer), $ax);
}
function $as(self, source, $at, $au) {
	const element = __clone(self[0]);
	$aw(source, (value, $av) => {
		element.textContent = value;
		return;
	}, $at, $au);
	return __clone(self);
}
function $cj(policy, body) {
	const fresh = new2();
	const result = body(fresh);
	drain(fresh);
	fresh[5].v = true;
	return result;
}
function $cr(signal, observer) {
	const cell = signal[0];
	return $aF(signal, mint_subscriber(() => {
		const $cs = [ 0, cell ];
		let $ct = null;
		if ($cs[0] === 0) {
			const live = $cs[1];
			$ct = observer(live.v);
		} else {
			$ct = undefined;
		}
		return $ct;
	}));
}
function $cq(self, observer, immediately) {
	const subscription = $cr(self, observer);
	if (immediately) {
		observer($B(self));
	}
	return subscription;
}
function $cp(self, observer) {
	return $cq(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $co(flow, observer, $ax, $ay) {
	$ca(get_owner($ay), $cp(flow, observer), $ax);
}
function $ck(self, condition, $cl, $cm) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	$co(condition, (visible, $cn) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $cl, $cm);
	return __clone(self);
}
function $cD(self, observer, immediately) {
	const subscription = $cr(self, observer);
	if (immediately) {
		observer($B(self));
	}
	return subscription;
}
function $cC(self, observer) {
	return $cD(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $cB(flow, observer, $ax, $ay) {
	$ca(get_owner($ay), $cC(flow, observer), $ax);
}
function $cA(self, source, $at, $au) {
	const element = __clone(self[0]);
	$cB(source, (value, $av) => {
		element.textContent = value;
		return;
	}, $at, $au);
	return __clone(self);
}
function $db(runs, body) {
	const run2 = renew(runs);
	const $dc = nursery(run2);
	let $dd = null;
	if ($dc[0] === 0) {
		const nursery2 = $dc[1];
		$dd = (($bn) => {
			return (($bo) => {
				return body($bn, $bo);
			})(nursery2);
		})(run2);
	} else {
		$dd = (() => {
			throw "a renewed run carries its nursery";
		})();
	}
	return $dd;
}
function $da(runs, tracker, body) {
	const scope = open_run(tracker);
	const value = $db(runs, ($aR, $aS) => {
		return (($aT) => {
			return body($aR, $aT, $aS);
		})(scope);
	});
	close_run(tracker);
	return value;
}
function $cZ(runs, tracker, body) {
	let value = $da(runs, tracker, ($aK, $aL, $aM) => {
		return body($aK, $aL, $aM);
	});
	let rounds = 0;
	while (tracker[0].v[4] && rounds < 100) {
		tracker[0].v[4] = false;
		value = $da(runs, tracker, ($bP, $bQ, $bR) => {
			return body($bP, $bQ, $bR);
		});
		rounds = rounds + 1;
	}
	if (tracker[0].v[4]) {
		tracker[0].v[4] = false;
	}
	return value;
}
function $cY(self) {
	const transform = self[1];
	const upstream = $aD(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return $cZ(runs, tracker, ($aG, $aH, $aI) => {
			return transform(value, $aG, $aH, $aI);
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
function $cX(flow, observer, immediately) {
	const instance = $cY(flow);
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
function $cW(self, observer) {
	return $cX(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $cV(flow, observer, $ax, $ay) {
	$ca(get_owner($ay), $cW(flow, observer), $ax);
}
function $cU(self, condition, $cl, $cm) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	$cV(condition, (visible, $cn) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $cl, $cm);
	return __clone(self);
}
function $dw(self, subscriber) {
	return $aF(self, subscriber);
}
function $du(self) {
	return [ () => {
		return $B(self);
	}, (subscriber) => {
		return $dw(self, subscriber);
	}, () => {
		return;
	} ];
}
function $dt(self) {
	const transform = self[1];
	const upstream = $du(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return $cZ(runs, tracker, ($aG, $aH, $aI) => {
			return transform(value, $aG, $aH, $aI);
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
function $ds(flow, observer, immediately) {
	const instance = $dt(flow);
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
function $dr(self, observer) {
	return $ds(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $dq(flow, observer, $ax, $ay) {
	$ca(get_owner($ay), $dr(flow, observer), $ax);
}
function $dp(self, condition, $cl, $cm) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	$dq(condition, (visible, $cn) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $cl, $cm);
	return __clone(self);
}
function $dH(source, key, render) {
	return [ source, key, render ];
}
function $dQ(held, at, count) {
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
function $dU(old_keys, old_items, items, key_of, same) {
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
			const $dV = head;
			let $dW = null;
			if ($dV[0] === 0) {
				const at = $dV[1];
				if (__at(claimed, at)) {
					head = __at(next_same, at);
				} else {
					advancing = false;
				}
				$dW = undefined;
			} else {
				$dW = advancing = false;
			}
			$dW;
		}
		const $dX = head;
		let $dY = null;
		if ($dX[0] === 0) {
			const at2 = $dX[1];
			$dY = first.set(canonical2, at2);
		} else {
			$dY = first.delete(canonical2);
		}
		$dY;
		let found = [ 1 ];
		let walk = head;
		let walking = true;
		while (walking) {
			const $dZ = walk;
			let $ea = null;
			if ($dZ[0] === 0) {
				const at3 = $dZ[1];
				if (!(__at(claimed, at3)) && __at(old_keys, at3) === item_key) {
					found = [ 0, at3 ];
					walking = false;
				} else {
					walk = __at(next_same, at3);
				}
				$ea = undefined;
			} else {
				$ea = walking = false;
			}
			$ea;
		}
		let step = [ 2 ];
		const $eb = found;
		if ($eb[0] === 0) {
			__at_put(claimed, $eb[1], true);
			let $ec = null;
			if (same(__at(old_items, $eb[1]), item)) {
				$ec = [ 0, $eb[1] ];
			} else {
				$ec = [ 1, $eb[1] ];
			}
			step = $ec;
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
function $en(self) {
	let result = [  ];
	let index = self.length;
	while (index > 0) {
		index = index - 1;
		result.push(__clone(__at(self, index)));
	}
	return result;
}
function $eK(self, content, end, $eL, $eM) {
	const marker = document.createTextNode("");
	host(self).insertBefore(marker, end);
	const staging = document.createDocumentFragment();
	place(content, [ __clone(staging) ], $eL, $eM);
	host(self).insertBefore(staging, end);
	return [ marker ];
}
function $eN(owner, body) {
	return body(owner);
}
function $eT(self) {
	return [ 1 ];
}
function $eW(self, cursor) {
	let none = [  ];
	return none;
}
function $eX(self, cursor) {

}
function $eS(self) {
	const $eU = $eT(self);
	let $eV = null;
	if ($eU[0] === 0) {
		const cursor = $eU[1];
		$eV = [ () => {
			return $B(self);
		}, (subscriber) => {
			return $dw(self, subscriber);
		}, () => {
			return $eW(self, cursor);
		}, () => {
			return $eX(self, cursor);
		} ];
	} else {
		$eV = [ () => {
			return $B(self);
		}, (subscriber) => {
			return $dw(self, subscriber);
		}, () => {
			return [ [ 2, $B(self) ] ];
		}, () => {
			return;
		} ];
	}
	return $eV;
}
function $eY(ops) {
	let last = [ 1 ];
	let index = 0;
	for (const op of ops) {
		const $eZ = op;
		let $fa = null;
		if ($eZ[0] === 2) {
			const _items = $eZ[1];
			last = [ 0, index ];
			$fa = undefined;
		} else {
			$fa = undefined;
		}
		$fa;
		index = index + 1;
	}
	const $fb = last;
	let $fc = null;
	if ($fb[0] === 0 && $fb[1] > 0) {
		$fc = $fb[1];
	} else {
		return __clone(ops);
	}
	const from = $fc;
	let live = [  ];
	index = from;
	while (index < ops.length) {
		live.push(__at(ops, index));
		index = index + 1;
	}
	return live;
}
function $dM(parent, source, key, render, $dN, $dO) {
	const region = open(parent);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_cells = __shared_new([  ]);
	const row_rows = region[2];
	const row_owners = __shared_new([  ]);
	defer(get_owner($dO), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		close(region);
		return;
	});
	const reconcile_span = (at, count, list) => {
		const whole = at === 0 && count === row_rows.v.length;
		const previous_cells = $dQ(row_cells, at, count);
		const previous_rows = $dQ(row_rows, at, count);
		const previous_owners = $dQ(row_owners, at, count);
		let $dT = null;
		if (at + count < row_rows.v.length) {
			$dT = __at(row_rows.v, at + count)[0];
		} else {
			$dT = region[0];
		}
		const boundary = __clone($dT);
		const same = (_before, _after) => {
			return true;
		};
		let $ed = null;
		if (whole) {
			$ed = $dU(__clone(row_keys.v), __clone(row_items.v), list, key, same);
		} else {
			$ed = $dU($dQ(row_keys, at, count), $dQ(row_items, at, count), list, key, same);
		}
		const plan = $ed;
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
			let $eu = null;
			if (__at(settled, settled_at)) {
				const $es = step;
				let $et = null;
				if ($es[0] === 0) {
					const index = $es[1];
					__at_put(staying, index, true);
					$et = undefined;
				} else {
					$et = undefined;
				}
				$eu = $et;
			}
			$eu;
			settled_at = settled_at + 1;
		}
		let cut = [  ];
		let index2 = 0;
		for (const row of previous_rows) {
			if (__at(staying, index2)) {
				cut.push([ 1 ]);
			} else {
				let $ev = null;
				if (index2 + 1 < previous_rows.length) {
					$ev = __at(previous_rows, index2 + 1)[0];
				} else {
					$ev = boundary;
				}
				const end = __clone($ev);
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
			const $ew = step2;
			let $ex = null;
			if ($ew[0] === 0) {
				const kept = $ew[1];
				const cell = __clone(__at(previous_cells, kept));
				$I(cell, item, $dN);
				next_cells.push(cell);
				const $eE = __at(cut, kept);
				let $eF = null;
				if ($eE[0] === 0) {
					const content = __clone($eE[1]);
					insert_row(region, __at(previous_rows, kept), content, reference);
					$eF = undefined;
				} else {
					$eF = undefined;
				}
				$eF;
				next_rows.push(__clone(__at(previous_rows, kept)));
				next_owners.push(__clone(__at(previous_owners, kept)));
				$ex = undefined;
			} else if ($ew[0] === 1) {
				const kept2 = $ew[1];
				const cell2 = __clone(__at(previous_cells, kept2));
				$I(cell2, item, $dN);
				next_cells.push(cell2);
				const $eG = __at(cut, kept2);
				let $eH = null;
				if ($eG[0] === 0) {
					const content2 = __clone($eG[1]);
					insert_row(region, __at(previous_rows, kept2), content2, reference);
					$eH = undefined;
				} else {
					$eH = undefined;
				}
				$eH;
				next_rows.push(__clone(__at(previous_rows, kept2)));
				next_owners.push(__clone(__at(previous_owners, kept2)));
				$ex = undefined;
			} else {
				const cell3 = $b(item);
				const owner = new3();
				next_cells.push(__clone(cell3));
				next_rows.push($eN(owner, ($eJ) => {
					return $eK(region, render(cell3, $eJ), reference, $dN, $eJ);
				}));
				next_owners.push(owner);
				$ex = undefined;
			}
			$ex;
			position = position + 1;
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		let $eO = null;
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
			$eO = undefined;
		}
		return $eO;
	};
	const reconcile_pass = (list) => {
		return reconcile_span(0, row_rows.v.length, list);
	};
	const splice_rows = (at, removed, inserted) => {
		let taken = 0;
		while (taken < removed) {
			let $eP = null;
			if (at + 1 < row_rows.v.length) {
				$eP = __at(row_rows.v, at + 1)[0];
			} else {
				$eP = region[0];
			}
			const end = __clone($eP);
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
		let $eQ = null;
		if (at < row_rows.v.length) {
			$eQ = __at(row_rows.v, at)[0];
		} else {
			$eQ = region[0];
		}
		const reference = __clone($eQ);
		let offset = 0;
		for (const item of inserted) {
			const cell = $b(__clone(item));
			const owner = new3();
			const row = $eN(owner, ($eR) => {
				return $eK(region, render(cell, $eR), reference, $dN, $eR);
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
	const instance = $eS(source);
	const drain2 = instance[2];
	const handle = instance[1](subscriber_of(() => {
		for (const op of $eY(drain2())) {
			const $fd = op;
			let $fe = null;
			if ($fd[0] === 0) {
				const at = $fd[1];
				const removed = $fd[2];
				const inserted = $fd[3];
				if (removed.length === 0 || inserted.length === 0) {
					splice_rows(at, removed.length, inserted);
				} else {
					reconcile_span(at, removed.length, inserted);
				}
				$fe = undefined;
			} else if ($fd[0] === 1) {
				const at2 = $fd[1];
				const _was = $fd[2];
				const value = $fd[3];
				const $ff = __list_get(row_keys.v, at2);
				let $fg = null;
				if ($ff[0] === 0) {
					const held = $ff[1];
					$fg = key(value) === held;
				} else {
					$fg = false;
				}
				const same_key = $fg;
				let $fj = null;
				if (same_key) {
					const $fh = __list_get(row_cells.v, at2);
					let $fi = null;
					if ($fh[0] === 0) {
						const cell = $fh[1];
						__at_put(row_items.v, at2, __clone(value));
						$I(cell, value, $dN);
						$fi = undefined;
					} else {
						$fi = undefined;
					}
					$fj = $fi;
				} else {
					splice_rows(at2, 1, [ __clone(value) ]);
				}
				$fe = $fj;
			} else if ($fd[0] === 2) {
				const items = $fd[1];
				$fe = reconcile_pass(items);
			} else {
				const from = $fd[1];
				const count = $fd[2];
				const to = $fd[3];
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
				$fe = undefined;
			}
			$fe;
		}
		return;
	}, false));
	also_releasing(handle, instance[3]);
	$ca(get_owner($dO), handle, $dN);
	reconcile_pass(instance[0]());
}
function $dJ(self, parent, $dK, $dL) {
	$dM(parent, __clone(self[0]), self[1], self[2], $dK, $dL);
}
function $dI(self, content, $ak, $al) {
	$dJ(content, self, $ak, $al);
	return __clone(self);
}
function $ft(self) {
	return [ () => {
		return $B(self);
	}, (subscriber) => {
		return $dw(self, subscriber);
	}, () => {
		return;
	} ];
}
function $fs(self) {
	const transform = self[1];
	const upstream = $ft(__clone(self[0]));
	const pull = upstream[0];
	const upstream_attach = upstream[1];
	const runs = new3();
	const tracker = new_tracker();
	return [ () => {
		const value = pull();
		return $cZ(runs, tracker, ($aG, $aH, $aI) => {
			return transform(value, $aG, $aH, $aI);
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
function $fr(flow, observer, immediately) {
	const instance = $fs(flow);
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
function $fq(self, observer) {
	return $fr(self, (value) => {
		return (() => {
			return observer(value, [ 1 ]);
		})();
	}, true);
}
function $fp(flow, observer, $ax, $ay) {
	$ca(get_owner($ay), $fq(flow, observer), $ax);
}
function $fo(self, condition, $cl, $cm) {
	const element = __clone(self[0]);
	const restored = element.style.getPropertyValue("display");
	$fp(condition, (visible, $cn) => {
		element.hidden = !(visible);
		if (visible) {
			element.style.setProperty("display", restored);
		} else {
			element.style.setProperty("display", "none");
		}
		return;
	}, $cl, $cm);
	return __clone(self);
}
function $gm(self) {
	const $go = $eT(self);
	let $gp = null;
	if ($go[0] === 0) {
		const cursor = $go[1];
		$gp = [ () => {
			return $B(self);
		}, (subscriber) => {
			return $dw(self, subscriber);
		}, () => {
			return $eW(self, cursor);
		}, () => {
			return $eX(self, cursor);
		} ];
	} else {
		$gp = [ () => {
			return $B(self);
		}, (subscriber) => {
			return $dw(self, subscriber);
		}, () => {
			return [ [ 2, $B(self) ] ];
		}, () => {
			return;
		} ];
	}
	return $gp;
}
function $fE(parent, source, key, render, $dN, $dO) {
	const region = open(parent);
	const row_keys = __shared_new([  ]);
	const row_items = __shared_new([  ]);
	const row_cells = __shared_new([  ]);
	const row_rows = region[2];
	const row_owners = __shared_new([  ]);
	defer(get_owner($dO), () => {
		for (const owner of row_owners.v) {
			dispose2(owner);
		}
		close(region);
		return;
	});
	const reconcile_span = (at, count, list) => {
		const whole = at === 0 && count === row_rows.v.length;
		const previous_cells = $dQ(row_cells, at, count);
		const previous_rows = $dQ(row_rows, at, count);
		const previous_owners = $dQ(row_owners, at, count);
		let $fG = null;
		if (at + count < row_rows.v.length) {
			$fG = __at(row_rows.v, at + count)[0];
		} else {
			$fG = region[0];
		}
		const boundary = __clone($fG);
		const same = (_before, _after) => {
			return true;
		};
		let $fQ = null;
		if (whole) {
			$fQ = $dU(__clone(row_keys.v), __clone(row_items.v), list, key, same);
		} else {
			$fQ = $dU($dQ(row_keys, at, count), $dQ(row_items, at, count), list, key, same);
		}
		const plan = $fQ;
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
			let $fU = null;
			if (__at(settled, settled_at)) {
				const $fS = step;
				let $fT = null;
				if ($fS[0] === 0) {
					const index = $fS[1];
					__at_put(staying, index, true);
					$fT = undefined;
				} else {
					$fT = undefined;
				}
				$fU = $fT;
			}
			$fU;
			settled_at = settled_at + 1;
		}
		let cut = [  ];
		let index2 = 0;
		for (const row of previous_rows) {
			if (__at(staying, index2)) {
				cut.push([ 1 ]);
			} else {
				let $fV = null;
				if (index2 + 1 < previous_rows.length) {
					$fV = __at(previous_rows, index2 + 1)[0];
				} else {
					$fV = boundary;
				}
				const end = __clone($fV);
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
			const $fW = step2;
			let $fX = null;
			if ($fW[0] === 0) {
				const kept = $fW[1];
				const cell = __clone(__at(previous_cells, kept));
				$I(cell, item, $dN);
				next_cells.push(cell);
				const $ge = __at(cut, kept);
				let $gf = null;
				if ($ge[0] === 0) {
					const content = __clone($ge[1]);
					insert_row(region, __at(previous_rows, kept), content, reference);
					$gf = undefined;
				} else {
					$gf = undefined;
				}
				$gf;
				next_rows.push(__clone(__at(previous_rows, kept)));
				next_owners.push(__clone(__at(previous_owners, kept)));
				$fX = undefined;
			} else if ($fW[0] === 1) {
				const kept2 = $fW[1];
				const cell2 = __clone(__at(previous_cells, kept2));
				$I(cell2, item, $dN);
				next_cells.push(cell2);
				const $gg = __at(cut, kept2);
				let $gh = null;
				if ($gg[0] === 0) {
					const content2 = __clone($gg[1]);
					insert_row(region, __at(previous_rows, kept2), content2, reference);
					$gh = undefined;
				} else {
					$gh = undefined;
				}
				$gh;
				next_rows.push(__clone(__at(previous_rows, kept2)));
				next_owners.push(__clone(__at(previous_owners, kept2)));
				$fX = undefined;
			} else {
				const cell3 = $b(item);
				const owner = new3();
				next_cells.push(__clone(cell3));
				next_rows.push($eN(owner, ($eJ) => {
					return $eK(region, render(cell3, $eJ), reference, $dN, $eJ);
				}));
				next_owners.push(owner);
				$fX = undefined;
			}
			$fX;
			position = position + 1;
		}
		let next_keys = [  ];
		for (const item2 of list) {
			next_keys.push(key(item2));
		}
		let $gj = null;
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
			$gj = undefined;
		}
		return $gj;
	};
	const reconcile_pass = (list) => {
		return reconcile_span(0, row_rows.v.length, list);
	};
	const splice_rows = (at, removed, inserted) => {
		let taken = 0;
		while (taken < removed) {
			let $gk = null;
			if (at + 1 < row_rows.v.length) {
				$gk = __at(row_rows.v, at + 1)[0];
			} else {
				$gk = region[0];
			}
			const end = __clone($gk);
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
		let $gl = null;
		if (at < row_rows.v.length) {
			$gl = __at(row_rows.v, at)[0];
		} else {
			$gl = region[0];
		}
		const reference = __clone($gl);
		let offset = 0;
		for (const item of inserted) {
			const cell = $b(__clone(item));
			const owner = new3();
			const row = $eN(owner, ($eR) => {
				return $eK(region, render(cell, $eR), reference, $dN, $eR);
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
	const instance = $gm(source);
	const drain2 = instance[2];
	const handle = instance[1](subscriber_of(() => {
		for (const op of $eY(drain2())) {
			const $gx = op;
			let $gy = null;
			if ($gx[0] === 0) {
				const at = $gx[1];
				const removed = $gx[2];
				const inserted = $gx[3];
				if (removed.length === 0 || inserted.length === 0) {
					splice_rows(at, removed.length, inserted);
				} else {
					reconcile_span(at, removed.length, inserted);
				}
				$gy = undefined;
			} else if ($gx[0] === 1) {
				const at2 = $gx[1];
				const _was = $gx[2];
				const value = $gx[3];
				const $gz = __list_get(row_keys.v, at2);
				let $gA = null;
				if ($gz[0] === 0) {
					const held = $gz[1];
					$gA = key(value) === held;
				} else {
					$gA = false;
				}
				const same_key = $gA;
				let $gD = null;
				if (same_key) {
					const $gB = __list_get(row_cells.v, at2);
					let $gC = null;
					if ($gB[0] === 0) {
						const cell = $gB[1];
						__at_put(row_items.v, at2, __clone(value));
						$I(cell, value, $dN);
						$gC = undefined;
					} else {
						$gC = undefined;
					}
					$gD = $gC;
				} else {
					splice_rows(at2, 1, [ __clone(value) ]);
				}
				$gy = $gD;
			} else if ($gx[0] === 2) {
				const items = $gx[1];
				$gy = reconcile_pass(items);
			} else {
				const from = $gx[1];
				const count = $gx[2];
				const to = $gx[3];
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
				$gy = undefined;
			}
			$gy;
		}
		return;
	}, false));
	also_releasing(handle, instance[3]);
	$ca(get_owner($dO), handle, $dN);
	reconcile_pass(instance[0]());
}
function $fD(self, parent, $dK, $dL) {
	$fE(parent, __clone(self[0]), self[1], self[2], $dK, $dL);
}
function $fC(self, content, $ak, $al) {
	$fD(content, self, $ak, $al);
	return __clone(self);
}
function $gF(body) {
	const scope = new3();
	const result = body(scope);
	return [ result, scope ];
}
function $gR(self, transform, $gS) {
	$v(self, transform($B(self)), $gS);
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
	return playground_page(status, diagnostics, console_lines, can_format, can_platform, share_label, mode, modified_from, confirm_target, run, format, share, confirm_replace, cancel_replace, [ 1 ], $O);
});
VilanPlayground.init("#editor", VilanPlayground.example("counter"));
VilanPlayground.startCompiler((event) => {
	const kind = event.kind;
	let $gO = null;
	if (kind === "ready") {
		$I(can_format, event.canFormat, [ 1 ]);
		$I(can_platform, event.canPlatform, [ 1 ]);
		if (!(event.canPlatform)) {
			VilanPlayground.setMode("browser");
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
		$gO = undefined;
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
		$gO = undefined;
	} else if (kind === "formatted") {
		if (event.changed) {
			$g(status, "Formatted.", [ 1 ]);
		} else {
			$g(status, "Format made no changes.", [ 1 ]);
		}
		$gO = undefined;
	} else if (kind === "shared") {
		if (event.copied) {
			$g(status, "Link copied to the clipboard.", [ 1 ]);
			flash_share("Copied!");
		} else {
			$g(status, "Link ready in the address bar.", [ 1 ]);
			flash_share("Link ready");
		}
		$gO = undefined;
	} else if (kind === "checked") {
		const count = apply_diagnostics(event);
		let $gP = null;
		if (event.ok) {
			if (event.platform === "node") {
				$g(status, "No problems (server check, vilan " + event.version + ").", [ 1 ]);
			} else {
				$g(status, "No problems (vilan " + event.version + ").", [ 1 ]);
			}
			$gP = undefined;
		} else if (count === 1) {
			$g(status, "1 problem; see the diagnostics.", [ 1 ]);
		} else {
			$g(status, "" + count + " problems; see the diagnostics.", [ 1 ]);
		}
		$gO = $gP;
	} else if (kind === "result") {
		apply_diagnostics(event);
		let $gQ = null;
		if (event.platform === "node") {
			if (event.ok) {
				$g(status, "Server program checks clean (vilan " + event.version + ").", [ 1 ]);
			} else {
				$g(status, "Build failed; see the diagnostics.", [ 1 ]);
			}
			$gQ = undefined;
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
			$gQ = undefined;
		}
		$gO = $gQ;
	} else if (kind === "crash") {
		$g(status, "The compiler crashed on this input; it has been restarted. Please report the program that did it.", [ 1 ]);
	}
	return $gO;
});
window.addEventListener("message", (host_event) => {
	const message = host_event.data;
	const expected = run_token.v;
	const kind = message.kind;
	if (expected !== "" && message.token === expected && (kind === "log" || kind === "error")) {
		$gR(console_lines, (lines) => {
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
