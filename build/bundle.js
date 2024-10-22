
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_svg_attributes(node, attributes) {
        for (const key in attributes) {
            attr(node, key, attributes[key]);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Components/Navbar/Navbar.svelte generated by Svelte v3.59.2 */

    const file$9 = "src/Components/Navbar/Navbar.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (27:16) {#each navlists as list}
    function create_each_block$5(ctx) {
    	let li;
    	let a;
    	let t0_value = /*list*/ ctx[2].label + "";
    	let t0;
    	let a_href_value;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "class", "nav-link light-color svelte-1enwtsw");
    			attr_dev(a, "href", a_href_value = /*list*/ ctx[2].url);
    			add_location(a, file$9, 28, 24, 1000);
    			attr_dev(li, "class", "nav-item svelte-1enwtsw");
    			add_location(li, file$9, 27, 20, 954);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*navlists*/ 1 && t0_value !== (t0_value = /*list*/ ctx[2].label + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*navlists*/ 1 && a_href_value !== (a_href_value = /*list*/ ctx[2].url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(27:16) {#each navlists as list}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let section;
    	let nav;
    	let a;
    	let t0;
    	let t1;
    	let button;
    	let span;
    	let t2;
    	let div;
    	let ul;
    	let each_value = /*navlists*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			nav = element("nav");
    			a = element("a");
    			t0 = text(/*header*/ ctx[1]);
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			t2 = space();
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a, "class", "dark-name");
    			attr_dev(a, "href", "/");
    			add_location(a, file$9, 11, 8, 357);
    			attr_dev(span, "class", "navbar-toggler-icon");
    			add_location(span, file$9, 22, 12, 727);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-toggle", "collapse");
    			attr_dev(button, "data-target", "#navbarNav");
    			attr_dev(button, "aria-controls", "navbarNav");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$9, 14, 8, 430);
    			attr_dev(ul, "class", "navbar-nav ml-auto svelte-1enwtsw");
    			add_location(ul, file$9, 25, 12, 861);
    			attr_dev(div, "class", "collapse navbar-collapse");
    			attr_dev(div, "id", "navbarNav");
    			add_location(div, file$9, 24, 8, 795);
    			attr_dev(nav, "class", "navbar main-bgcolor navbar-expand-md navbar-dark svelte-1enwtsw");
    			add_location(nav, file$9, 10, 4, 286);
    			attr_dev(section, "id", "nav-bar");
    			attr_dev(section, "class", "svelte-1enwtsw");
    			add_location(section, file$9, 9, 0, 259);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, nav);
    			append_dev(nav, a);
    			append_dev(a, t0);
    			append_dev(nav, t1);
    			append_dev(nav, button);
    			append_dev(button, span);
    			append_dev(nav, t2);
    			append_dev(nav, div);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*header*/ 2) set_data_dev(t0, /*header*/ ctx[1]);

    			if (dirty & /*navlists*/ 1) {
    				each_value = /*navlists*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	let { navlists = [] } = $$props;
    	let { header } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (header === undefined && !('header' in $$props || $$self.$$.bound[$$self.$$.props['header']])) {
    			console.warn("<Navbar> was created without expected prop 'header'");
    		}
    	});

    	const writable_props = ['navlists', 'header'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('navlists' in $$props) $$invalidate(0, navlists = $$props.navlists);
    		if ('header' in $$props) $$invalidate(1, header = $$props.header);
    	};

    	$$self.$capture_state = () => ({ navlists, header });

    	$$self.$inject_state = $$props => {
    		if ('navlists' in $$props) $$invalidate(0, navlists = $$props.navlists);
    		if ('header' in $$props) $$invalidate(1, header = $$props.header);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [navlists, header];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { navlists: 0, header: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get navlists() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set navlists(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get header() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-awesome/components/svg/Raw.svelte generated by Svelte v3.59.2 */

    const file$8 = "node_modules/svelte-awesome/components/svg/Raw.svelte";

    function create_fragment$9(ctx) {
    	let g;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			add_location(g, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			g.innerHTML = /*raw*/ ctx[0];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*raw*/ 1) g.innerHTML = /*raw*/ ctx[0];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Raw', slots, []);
    	let cursor = 0xd4937;

    	function getId() {
    		cursor += 1;
    		return `fa-${cursor.toString(16)}`;
    	}

    	let raw = '';
    	let { data } = $$props;

    	function getRaw(data) {
    		if (!data || !data.raw) {
    			return '';
    		}

    		let rawData = data.raw;
    		const ids = {};

    		rawData = rawData.replace(/\s(?:xml:)?id=["']?([^"')\s]+)/g, (match, id) => {
    			const uniqueId = getId();
    			ids[id] = uniqueId;
    			return ` id="${uniqueId}"`;
    		});

    		rawData = rawData.replace(/#(?:([^'")\s]+)|xpointer\(id\((['"]?)([^')]+)\2\)\))/g, (match, rawId, _, pointerId) => {
    			const id = rawId || pointerId;

    			if (!id || !ids[id]) {
    				return match;
    			}

    			return `#${ids[id]}`;
    		});

    		return rawData;
    	}

    	$$self.$$.on_mount.push(function () {
    		if (data === undefined && !('data' in $$props || $$self.$$.bound[$$self.$$.props['data']])) {
    			console.warn("<Raw> was created without expected prop 'data'");
    		}
    	});

    	const writable_props = ['data'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Raw> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(1, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ cursor, getId, raw, data, getRaw });

    	$$self.$inject_state = $$props => {
    		if ('cursor' in $$props) cursor = $$props.cursor;
    		if ('raw' in $$props) $$invalidate(0, raw = $$props.raw);
    		if ('data' in $$props) $$invalidate(1, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 2) {
    			$$invalidate(0, raw = getRaw(data));
    		}
    	};

    	return [raw, data];
    }

    class Raw extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { data: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Raw",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get data() {
    		throw new Error("<Raw>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Raw>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-awesome/components/svg/Svg.svelte generated by Svelte v3.59.2 */

    const file$7 = "node_modules/svelte-awesome/components/svg/Svg.svelte";

    function create_fragment$8(ctx) {
    	let svg;
    	let svg_class_value;
    	let svg_role_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

    	let svg_levels = [
    		{ version: "1.1" },
    		{
    			class: svg_class_value = "fa-icon " + /*className*/ ctx[0]
    		},
    		{ width: /*width*/ ctx[1] },
    		{ height: /*height*/ ctx[2] },
    		{ "aria-label": /*label*/ ctx[9] },
    		{
    			role: svg_role_value = /*label*/ ctx[9] ? 'img' : 'presentation'
    		},
    		{ viewBox: /*box*/ ctx[3] },
    		{ style: /*style*/ ctx[8] },
    		/*$$restProps*/ ctx[10]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			if (default_slot) default_slot.c();
    			set_svg_attributes(svg, svg_data);
    			toggle_class(svg, "fa-spin", /*spin*/ ctx[4]);
    			toggle_class(svg, "fa-pulse", /*pulse*/ ctx[6]);
    			toggle_class(svg, "fa-inverse", /*inverse*/ ctx[5]);
    			toggle_class(svg, "fa-flip-horizontal", /*flip*/ ctx[7] === 'horizontal');
    			toggle_class(svg, "fa-flip-vertical", /*flip*/ ctx[7] === 'vertical');
    			toggle_class(svg, "svelte-1mc5hvj", true);
    			add_location(svg, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);

    			if (default_slot) {
    				default_slot.m(svg, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
    						null
    					);
    				}
    			}

    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ version: "1.1" },
    				(!current || dirty & /*className*/ 1 && svg_class_value !== (svg_class_value = "fa-icon " + /*className*/ ctx[0])) && { class: svg_class_value },
    				(!current || dirty & /*width*/ 2) && { width: /*width*/ ctx[1] },
    				(!current || dirty & /*height*/ 4) && { height: /*height*/ ctx[2] },
    				(!current || dirty & /*label*/ 512) && { "aria-label": /*label*/ ctx[9] },
    				(!current || dirty & /*label*/ 512 && svg_role_value !== (svg_role_value = /*label*/ ctx[9] ? 'img' : 'presentation')) && { role: svg_role_value },
    				(!current || dirty & /*box*/ 8) && { viewBox: /*box*/ ctx[3] },
    				(!current || dirty & /*style*/ 256) && { style: /*style*/ ctx[8] },
    				dirty & /*$$restProps*/ 1024 && /*$$restProps*/ ctx[10]
    			]));

    			toggle_class(svg, "fa-spin", /*spin*/ ctx[4]);
    			toggle_class(svg, "fa-pulse", /*pulse*/ ctx[6]);
    			toggle_class(svg, "fa-inverse", /*inverse*/ ctx[5]);
    			toggle_class(svg, "fa-flip-horizontal", /*flip*/ ctx[7] === 'horizontal');
    			toggle_class(svg, "fa-flip-vertical", /*flip*/ ctx[7] === 'vertical');
    			toggle_class(svg, "svelte-1mc5hvj", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const omit_props_names = ["class","width","height","box","spin","inverse","pulse","flip","style","label"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Svg', slots, ['default']);
    	let { class: className = '' } = $$props;
    	let { width } = $$props;
    	let { height } = $$props;
    	let { box = '0 0 0 0' } = $$props;
    	let { spin = false } = $$props;
    	let { inverse = false } = $$props;
    	let { pulse = false } = $$props;
    	let { flip = 'none' } = $$props;
    	let { style = '' } = $$props;
    	let { label = '' } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (width === undefined && !('width' in $$props || $$self.$$.bound[$$self.$$.props['width']])) {
    			console.warn("<Svg> was created without expected prop 'width'");
    		}

    		if (height === undefined && !('height' in $$props || $$self.$$.bound[$$self.$$.props['height']])) {
    			console.warn("<Svg> was created without expected prop 'height'");
    		}
    	});

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(10, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('class' in $$new_props) $$invalidate(0, className = $$new_props.class);
    		if ('width' in $$new_props) $$invalidate(1, width = $$new_props.width);
    		if ('height' in $$new_props) $$invalidate(2, height = $$new_props.height);
    		if ('box' in $$new_props) $$invalidate(3, box = $$new_props.box);
    		if ('spin' in $$new_props) $$invalidate(4, spin = $$new_props.spin);
    		if ('inverse' in $$new_props) $$invalidate(5, inverse = $$new_props.inverse);
    		if ('pulse' in $$new_props) $$invalidate(6, pulse = $$new_props.pulse);
    		if ('flip' in $$new_props) $$invalidate(7, flip = $$new_props.flip);
    		if ('style' in $$new_props) $$invalidate(8, style = $$new_props.style);
    		if ('label' in $$new_props) $$invalidate(9, label = $$new_props.label);
    		if ('$$scope' in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		className,
    		width,
    		height,
    		box,
    		spin,
    		inverse,
    		pulse,
    		flip,
    		style,
    		label
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('className' in $$props) $$invalidate(0, className = $$new_props.className);
    		if ('width' in $$props) $$invalidate(1, width = $$new_props.width);
    		if ('height' in $$props) $$invalidate(2, height = $$new_props.height);
    		if ('box' in $$props) $$invalidate(3, box = $$new_props.box);
    		if ('spin' in $$props) $$invalidate(4, spin = $$new_props.spin);
    		if ('inverse' in $$props) $$invalidate(5, inverse = $$new_props.inverse);
    		if ('pulse' in $$props) $$invalidate(6, pulse = $$new_props.pulse);
    		if ('flip' in $$props) $$invalidate(7, flip = $$new_props.flip);
    		if ('style' in $$props) $$invalidate(8, style = $$new_props.style);
    		if ('label' in $$props) $$invalidate(9, label = $$new_props.label);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		className,
    		width,
    		height,
    		box,
    		spin,
    		inverse,
    		pulse,
    		flip,
    		style,
    		label,
    		$$restProps,
    		$$scope,
    		slots
    	];
    }

    class Svg extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			class: 0,
    			width: 1,
    			height: 2,
    			box: 3,
    			spin: 4,
    			inverse: 5,
    			pulse: 6,
    			flip: 7,
    			style: 8,
    			label: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Svg",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get class() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get box() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set box(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spin() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spin(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inverse() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inverse(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pulse() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pulse(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flip() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flip(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-awesome/components/Icon.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$6 = "node_modules/svelte-awesome/components/Icon.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    // (15:4) {#if iconData}
    function create_if_block$1(ctx) {
    	let t0;
    	let t1;
    	let if_block2_anchor;
    	let current;
    	let if_block0 = /*iconData*/ ctx[6].paths && create_if_block_3(ctx);
    	let if_block1 = /*iconData*/ ctx[6].polygons && create_if_block_2(ctx);
    	let if_block2 = /*iconData*/ ctx[6].raw && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*iconData*/ ctx[6].paths) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*iconData*/ ctx[6].polygons) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*iconData*/ ctx[6].raw) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*iconData*/ 64) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(15:4) {#if iconData}",
    		ctx
    	});

    	return block;
    }

    // (16:6) {#if iconData.paths}
    function create_if_block_3(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*iconData*/ ctx[6].paths;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*iconData*/ 64) {
    				each_value_1 = /*iconData*/ ctx[6].paths;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(16:6) {#if iconData.paths}",
    		ctx
    	});

    	return block;
    }

    // (17:8) {#each iconData.paths as path}
    function create_each_block_1(ctx) {
    	let path;
    	let path_levels = [/*path*/ ctx[30]];
    	let path_data = {};

    	for (let i = 0; i < path_levels.length; i += 1) {
    		path_data = assign(path_data, path_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			set_svg_attributes(path, path_data);
    			add_location(path, file$6, 17, 10, 253);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			set_svg_attributes(path, path_data = get_spread_update(path_levels, [dirty[0] & /*iconData*/ 64 && /*path*/ ctx[30]]));
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(17:8) {#each iconData.paths as path}",
    		ctx
    	});

    	return block;
    }

    // (21:6) {#if iconData.polygons}
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let each_value = /*iconData*/ ctx[6].polygons;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*iconData*/ 64) {
    				each_value = /*iconData*/ ctx[6].polygons;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(21:6) {#if iconData.polygons}",
    		ctx
    	});

    	return block;
    }

    // (22:8) {#each iconData.polygons as polygon}
    function create_each_block$4(ctx) {
    	let polygon;
    	let polygon_levels = [/*polygon*/ ctx[27]];
    	let polygon_data = {};

    	for (let i = 0; i < polygon_levels.length; i += 1) {
    		polygon_data = assign(polygon_data, polygon_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			polygon = svg_element("polygon");
    			set_svg_attributes(polygon, polygon_data);
    			add_location(polygon, file$6, 22, 10, 385);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, polygon, anchor);
    		},
    		p: function update(ctx, dirty) {
    			set_svg_attributes(polygon, polygon_data = get_spread_update(polygon_levels, [dirty[0] & /*iconData*/ 64 && /*polygon*/ ctx[27]]));
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(polygon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(22:8) {#each iconData.polygons as polygon}",
    		ctx
    	});

    	return block;
    }

    // (26:6) {#if iconData.raw}
    function create_if_block_1(ctx) {
    	let raw;
    	let updating_data;
    	let current;

    	function raw_data_binding(value) {
    		/*raw_data_binding*/ ctx[16](value);
    	}

    	let raw_props = {};

    	if (/*iconData*/ ctx[6] !== void 0) {
    		raw_props.data = /*iconData*/ ctx[6];
    	}

    	raw = new Raw({ props: raw_props, $$inline: true });
    	binding_callbacks.push(() => bind(raw, 'data', raw_data_binding));

    	const block = {
    		c: function create() {
    			create_component(raw.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(raw, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const raw_changes = {};

    			if (!updating_data && dirty[0] & /*iconData*/ 64) {
    				updating_data = true;
    				raw_changes.data = /*iconData*/ ctx[6];
    				add_flush_callback(() => updating_data = false);
    			}

    			raw.$set(raw_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(raw.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(raw.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(raw, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(26:6) {#if iconData.raw}",
    		ctx
    	});

    	return block;
    }

    // (14:8)      
    function fallback_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*iconData*/ ctx[6] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*iconData*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*iconData*/ 64) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(14:8)      ",
    		ctx
    	});

    	return block;
    }

    // (1:0) <Svg   {label}   {width}   {height}   {box}   style={combinedStyle}   {spin}   {flip}   {inverse}   {pulse}   class={className}   {...$$restProps} >
    function create_default_slot(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[17], null);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 131072)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[17],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[17])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[17], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty[0] & /*iconData*/ 64)) {
    					default_slot_or_fallback.p(ctx, !current ? [-1, -1] : dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(1:0) <Svg   {label}   {width}   {height}   {box}   style={combinedStyle}   {spin}   {flip}   {inverse}   {pulse}   class={className}   {...$$restProps} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let svg;
    	let current;

    	const svg_spread_levels = [
    		{ label: /*label*/ ctx[5] },
    		{ width: /*width*/ ctx[7] },
    		{ height: /*height*/ ctx[8] },
    		{ box: /*box*/ ctx[10] },
    		{ style: /*combinedStyle*/ ctx[9] },
    		{ spin: /*spin*/ ctx[1] },
    		{ flip: /*flip*/ ctx[4] },
    		{ inverse: /*inverse*/ ctx[2] },
    		{ pulse: /*pulse*/ ctx[3] },
    		{ class: /*className*/ ctx[0] },
    		/*$$restProps*/ ctx[11]
    	];

    	let svg_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < svg_spread_levels.length; i += 1) {
    		svg_props = assign(svg_props, svg_spread_levels[i]);
    	}

    	svg = new Svg({ props: svg_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(svg.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(svg, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const svg_changes = (dirty[0] & /*label, width, height, box, combinedStyle, spin, flip, inverse, pulse, className, $$restProps*/ 4031)
    			? get_spread_update(svg_spread_levels, [
    					dirty[0] & /*label*/ 32 && { label: /*label*/ ctx[5] },
    					dirty[0] & /*width*/ 128 && { width: /*width*/ ctx[7] },
    					dirty[0] & /*height*/ 256 && { height: /*height*/ ctx[8] },
    					dirty[0] & /*box*/ 1024 && { box: /*box*/ ctx[10] },
    					dirty[0] & /*combinedStyle*/ 512 && { style: /*combinedStyle*/ ctx[9] },
    					dirty[0] & /*spin*/ 2 && { spin: /*spin*/ ctx[1] },
    					dirty[0] & /*flip*/ 16 && { flip: /*flip*/ ctx[4] },
    					dirty[0] & /*inverse*/ 4 && { inverse: /*inverse*/ ctx[2] },
    					dirty[0] & /*pulse*/ 8 && { pulse: /*pulse*/ ctx[3] },
    					dirty[0] & /*className*/ 1 && { class: /*className*/ ctx[0] },
    					dirty[0] & /*$$restProps*/ 2048 && get_spread_object(/*$$restProps*/ ctx[11])
    				])
    			: {};

    			if (dirty[0] & /*$$scope, iconData*/ 131136) {
    				svg_changes.$$scope = { dirty, ctx };
    			}

    			svg.$set(svg_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(svg.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(svg.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(svg, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function normaliseData(data) {
    	let name;
    	let iconData;

    	if (!data) {
    		return undefined;
    	} else if ('definition' in data) {
    		console.error("`import faIconName from '@fortawesome/package-name/faIconName` not supported - Please use `import { faIconName } from '@fortawesome/package-name/faIconName'` instead");
    		return undefined;
    	} else if ('iconName' in data && 'icon' in data) {
    		name = data.iconName;
    		let paths = [];

    		// fontawesome v5/6 icon imported with:
    		// import { iconName } from '@fortawesome/packagename/iconName';
    		// import { iconName } from '@fortawesome/packagename';
    		const [width, height, ,,path] = data.icon;

    		if (Array.isArray(path)) {
    			paths = path;
    		} else {
    			paths = [path];
    		}

    		iconData = {
    			width,
    			height,
    			paths: paths.map(path => {
    				return { d: path };
    			})
    		};
    	} else {
    		// inbuilt icons
    		name = Object.keys(data)[0];

    		iconData = data[name];
    	}

    	return iconData;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const omit_props_names = ["class","data","scale","spin","inverse","pulse","flip","label","style"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Icon', slots, ['default']);
    	let { class: className = '' } = $$props;
    	let { data } = $$props;
    	let iconData;
    	let { scale = 1 } = $$props;
    	let { spin = false } = $$props;
    	let { inverse = false } = $$props;
    	let { pulse = false } = $$props;
    	let { flip = undefined } = $$props;
    	let { label = '' } = $$props;
    	let { style = '' } = $$props;

    	// internal
    	let childrenHeight = 0;

    	let childrenWidth = 0;
    	let outerScale = 1;
    	let width = 10;
    	let height = 10;
    	let combinedStyle;
    	let box;

    	function normalisedScale() {
    		let numScale = 1;

    		if (typeof scale !== 'undefined') {
    			numScale = Number(scale);
    		}

    		if (isNaN(numScale) || numScale <= 0) {
    			console.warn('Invalid prop: prop "scale" should be a number over 0.');
    			return outerScale;
    		}

    		return numScale * outerScale;
    	}

    	function calculateBox() {
    		if (iconData) {
    			return `0 0 ${iconData.width} ${iconData.height}`;
    		}

    		return `0 0 ${width} ${height}`;
    	}

    	function calculateRatio() {
    		if (!iconData) {
    			return 1;
    		}

    		return Math.max(iconData.width, iconData.height) / 16;
    	}

    	function calculateWidth() {
    		if (childrenWidth) {
    			return childrenWidth;
    		}

    		if (iconData) {
    			return iconData.width / calculateRatio() * normalisedScale();
    		}

    		return 0;
    	}

    	function calculateHeight() {
    		if (childrenHeight) {
    			return childrenHeight;
    		}

    		if (iconData) {
    			return iconData.height / calculateRatio() * normalisedScale();
    		}

    		return 0;
    	}

    	function calculateStyle() {
    		let combined = '';

    		if (style !== null) {
    			combined += style;
    		}

    		let size = normalisedScale();

    		if (size === 1) {
    			if (combined.length === 0) {
    				return '';
    			}

    			return combined;
    		}

    		if (combined !== '' && !combined.endsWith(';')) {
    			combined += '; ';
    		}

    		return `${combined}font-size: ${size}em`;
    	}

    	$$self.$$.on_mount.push(function () {
    		if (data === undefined && !('data' in $$props || $$self.$$.bound[$$self.$$.props['data']])) {
    			console_1.warn("<Icon> was created without expected prop 'data'");
    		}
    	});

    	function raw_data_binding(value) {
    		iconData = value;
    		((($$invalidate(6, iconData), $$invalidate(12, data)), $$invalidate(14, style)), $$invalidate(13, scale));
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(11, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('class' in $$new_props) $$invalidate(0, className = $$new_props.class);
    		if ('data' in $$new_props) $$invalidate(12, data = $$new_props.data);
    		if ('scale' in $$new_props) $$invalidate(13, scale = $$new_props.scale);
    		if ('spin' in $$new_props) $$invalidate(1, spin = $$new_props.spin);
    		if ('inverse' in $$new_props) $$invalidate(2, inverse = $$new_props.inverse);
    		if ('pulse' in $$new_props) $$invalidate(3, pulse = $$new_props.pulse);
    		if ('flip' in $$new_props) $$invalidate(4, flip = $$new_props.flip);
    		if ('label' in $$new_props) $$invalidate(5, label = $$new_props.label);
    		if ('style' in $$new_props) $$invalidate(14, style = $$new_props.style);
    		if ('$$scope' in $$new_props) $$invalidate(17, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Raw,
    		Svg,
    		className,
    		data,
    		iconData,
    		scale,
    		spin,
    		inverse,
    		pulse,
    		flip,
    		label,
    		style,
    		childrenHeight,
    		childrenWidth,
    		outerScale,
    		width,
    		height,
    		combinedStyle,
    		box,
    		normaliseData,
    		normalisedScale,
    		calculateBox,
    		calculateRatio,
    		calculateWidth,
    		calculateHeight,
    		calculateStyle
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('className' in $$props) $$invalidate(0, className = $$new_props.className);
    		if ('data' in $$props) $$invalidate(12, data = $$new_props.data);
    		if ('iconData' in $$props) $$invalidate(6, iconData = $$new_props.iconData);
    		if ('scale' in $$props) $$invalidate(13, scale = $$new_props.scale);
    		if ('spin' in $$props) $$invalidate(1, spin = $$new_props.spin);
    		if ('inverse' in $$props) $$invalidate(2, inverse = $$new_props.inverse);
    		if ('pulse' in $$props) $$invalidate(3, pulse = $$new_props.pulse);
    		if ('flip' in $$props) $$invalidate(4, flip = $$new_props.flip);
    		if ('label' in $$props) $$invalidate(5, label = $$new_props.label);
    		if ('style' in $$props) $$invalidate(14, style = $$new_props.style);
    		if ('childrenHeight' in $$props) childrenHeight = $$new_props.childrenHeight;
    		if ('childrenWidth' in $$props) childrenWidth = $$new_props.childrenWidth;
    		if ('outerScale' in $$props) outerScale = $$new_props.outerScale;
    		if ('width' in $$props) $$invalidate(7, width = $$new_props.width);
    		if ('height' in $$props) $$invalidate(8, height = $$new_props.height);
    		if ('combinedStyle' in $$props) $$invalidate(9, combinedStyle = $$new_props.combinedStyle);
    		if ('box' in $$props) $$invalidate(10, box = $$new_props.box);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*data, style, scale*/ 28672) {
    			{
    				$$invalidate(6, iconData = normaliseData(data));
    				$$invalidate(7, width = calculateWidth());
    				$$invalidate(8, height = calculateHeight());
    				$$invalidate(9, combinedStyle = calculateStyle());
    				$$invalidate(10, box = calculateBox());
    			}
    		}
    	};

    	return [
    		className,
    		spin,
    		inverse,
    		pulse,
    		flip,
    		label,
    		iconData,
    		width,
    		height,
    		combinedStyle,
    		box,
    		$$restProps,
    		data,
    		scale,
    		style,
    		slots,
    		raw_data_binding,
    		$$scope
    	];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$7,
    			create_fragment$7,
    			safe_not_equal,
    			{
    				class: 0,
    				data: 12,
    				scale: 13,
    				spin: 1,
    				inverse: 2,
    				pulse: 3,
    				flip: 4,
    				label: 5,
    				style: 14
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get class() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scale() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spin() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spin(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inverse() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inverse(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pulse() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pulse(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flip() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flip(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const githubSquare = {
        'github-square': {
            width: 1536,
            height: 1792,
            paths: [
                {
                    d: 'M519 1200q4-6-3-13-9-7-14-2-4 6 3 13 9 7 14 2zM491 1159q-5-7-12-4-6 4 0 12 7 8 12 5 6-4 0-13zM450 1119q2-4-5-8-7-2-8 2-3 5 4 8 8 2 9-2zM471 1142q2-1 1.5-4.5t-3.5-5.5q-6-7-10-3t1 11q6 6 11 2zM557 1217q2-7-9-11-9-3-13 4-2 7 9 11 9 3 13-4zM599 1220q0-8-12-8-10 0-10 8t11 8 11-8zM638 1213q-2-7-13-5t-9 9q2 8 12 6t10-10zM1280 896q0-212-150-362t-362-150-362 150-150 362q0 167 98 300.5t252 185.5q18 3 26.5-5t8.5-20q0-52-1-95-6 1-15.5 2.5t-35.5 2-48-4-43.5-20-29.5-41.5q-23-59-57-74-2-1-4.5-3.5l-8-8t-7-9.5 4-7.5 19.5-3.5q6 0 15 2t30 15.5 33 35.5q16 28 37.5 42t43.5 14 38-3.5 30-9.5q7-47 33-69-49-6-86-18.5t-73-39-55.5-76-19.5-119.5q0-79 53-137-24-62 5-136 19-6 54.5 7.5t60.5 29.5l26 16q58-17 128-17t128 17q11-7 28.5-18t55.5-26 57-9q29 74 5 136 53 58 53 137 0 57-14 100.5t-35.5 70-53.5 44.5-62.5 26-68.5 12q35 31 35 95 0 40-0.5 89t-0.5 51q0 12 8.5 20t26.5 5q154-52 252-185.5t98-300.5zM1536 416v960q0 119-84.5 203.5t-203.5 84.5h-960q-119 0-203.5-84.5t-84.5-203.5v-960q0-119 84.5-203.5t203.5-84.5h960q119 0 203.5 84.5t84.5 203.5z'
                }
            ]
        }
    };

    const linkedinSquare = {
        'linkedin-square': {
            width: 1536,
            height: 1792,
            paths: [
                {
                    d: 'M237 1414h231v-694h-231v694zM483 506q-1-52-36-86t-93-34-94.5 34-36.5 86q0 51 35.5 85.5t92.5 34.5h1q59 0 95-34.5t36-85.5zM1068 1414h231v-398q0-154-73-233t-193-79q-136 0-209 117h2v-101h-231q3 66 0 694h231v-388q0-38 7-56 15-35 45-59.5t74-24.5q116 0 116 157v371zM1536 416v960q0 119-84.5 203.5t-203.5 84.5h-960q-119 0-203.5-84.5t-84.5-203.5v-960q0-119 84.5-203.5t203.5-84.5h960q119 0 203.5 84.5t84.5 203.5z'
                }
            ]
        }
    };

    /* src/Components/Banner/Banner.svelte generated by Svelte v3.59.2 */
    const file$5 = "src/Components/Banner/Banner.svelte";

    function create_fragment$6(ctx) {
    	let section;
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let icon0;
    	let t4;
    	let a0;
    	let t5;
    	let t6;
    	let br;
    	let t7;
    	let icon1;
    	let t8;
    	let a1;
    	let t9;
    	let t10;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t11;
    	let img1;
    	let img1_src_value;
    	let current;

    	icon0 = new Icon({
    			props: { data: githubSquare, scale: "1.5" },
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: { data: linkedinSquare, scale: "1.5" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = `${/*HEADING*/ ctx[0]}`;
    			t1 = space();
    			p = element("p");
    			p.textContent = `${/*DESCRIPTION*/ ctx[1]}`;
    			t3 = space();
    			create_component(icon0.$$.fragment);
    			t4 = space();
    			a0 = element("a");
    			t5 = text(/*VISIT_GITHUB*/ ctx[3]);
    			t6 = space();
    			br = element("br");
    			t7 = space();
    			create_component(icon1.$$.fragment);
    			t8 = space();
    			a1 = element("a");
    			t9 = text(/*VISIT_LINKEDIN*/ ctx[5]);
    			t10 = space();
    			div1 = element("div");
    			img0 = element("img");
    			t11 = space();
    			img1 = element("img");
    			attr_dev(h1, "class", "svelte-uh8xfs");
    			add_location(h1, file$5, 16, 16, 691);
    			add_location(p, file$5, 17, 16, 726);
    			attr_dev(a0, "href", /*GITHUB_URL*/ ctx[2]);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noreferrer");
    			attr_dev(a0, "class", "icon-label svelte-uh8xfs");
    			add_location(a0, file$5, 19, 16, 819);
    			add_location(br, file$5, 22, 16, 965);
    			attr_dev(a1, "href", /*LINKEDIN_URL*/ ctx[4]);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noreferrer");
    			attr_dev(a1, "class", "icon-label svelte-uh8xfs");
    			add_location(a1, file$5, 24, 16, 1044);
    			attr_dev(div0, "class", "col-md-6");
    			add_location(div0, file$5, 15, 12, 652);
    			if (!src_url_equal(img0.src, img0_src_value = "images/WebsiteBannerImage.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "class", "img-fluid");
    			add_location(img0, file$5, 29, 16, 1248);
    			attr_dev(div1, "class", "col-md-6");
    			add_location(div1, file$5, 28, 12, 1209);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$5, 14, 8, 622);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$5, 13, 4, 590);
    			if (!src_url_equal(img1.src, img1_src_value = "images/wave1.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "wave-img svelte-uh8xfs");
    			add_location(img1, file$5, 33, 4, 1366);
    			attr_dev(section, "class", "main-bgcolor light-color svelte-uh8xfs");
    			attr_dev(section, "id", "");
    			add_location(section, file$5, 12, 0, 537);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div0, t3);
    			mount_component(icon0, div0, null);
    			append_dev(div0, t4);
    			append_dev(div0, a0);
    			append_dev(a0, t5);
    			append_dev(div0, t6);
    			append_dev(div0, br);
    			append_dev(div0, t7);
    			mount_component(icon1, div0, null);
    			append_dev(div0, t8);
    			append_dev(div0, a1);
    			append_dev(a1, t9);
    			append_dev(div2, t10);
    			append_dev(div2, div1);
    			append_dev(div1, img0);
    			append_dev(section, t11);
    			append_dev(section, img1);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(icon0);
    			destroy_component(icon1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Banner', slots, []);
    	let { bannerData = {} } = $$props;
    	const { HEADING, DESCRIPTION, GITHUB_URL, VISIT_GITHUB, LINKEDIN_URL, VISIT_LINKEDIN } = bannerData;
    	const writable_props = ['bannerData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Banner> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('bannerData' in $$props) $$invalidate(6, bannerData = $$props.bannerData);
    	};

    	$$self.$capture_state = () => ({
    		Icon,
    		githubSquare,
    		linkedInSquare: linkedinSquare,
    		bannerData,
    		HEADING,
    		DESCRIPTION,
    		GITHUB_URL,
    		VISIT_GITHUB,
    		LINKEDIN_URL,
    		VISIT_LINKEDIN
    	});

    	$$self.$inject_state = $$props => {
    		if ('bannerData' in $$props) $$invalidate(6, bannerData = $$props.bannerData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		HEADING,
    		DESCRIPTION,
    		GITHUB_URL,
    		VISIT_GITHUB,
    		LINKEDIN_URL,
    		VISIT_LINKEDIN,
    		bannerData
    	];
    }

    class Banner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { bannerData: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Banner",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get bannerData() {
    		throw new Error("<Banner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bannerData(value) {
    		throw new Error("<Banner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Projects/Projects.svelte generated by Svelte v3.59.2 */

    const file$4 = "src/Components/Projects/Projects.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (20:24) {#if list.APP_STORE_URL !== ""}
    function create_if_block(ctx) {
    	let a;
    	let t;
    	let br;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("View on App Store");
    			br = element("br");
    			attr_dev(a, "href", /*list*/ ctx[4].APP_STORE_URL);
    			add_location(a, file$4, 20, 28, 802);
    			add_location(br, file$4, 20, 78, 852);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    			insert_dev(target, br, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(20:24) {#if list.APP_STORE_URL !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (15:12) {#each PROJECT_LIST as list}
    function create_each_block$3(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let h4;
    	let t1_value = /*list*/ ctx[4].LABEL + "";
    	let t1;
    	let t2;
    	let div0;
    	let t3;
    	let a;
    	let t4;
    	let t5;
    	let p;
    	let t6_value = /*list*/ ctx[4].DESCRIPTION + "";
    	let t6;
    	let if_block = /*list*/ ctx[4].APP_STORE_URL !== "" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			h4 = element("h4");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			if (if_block) if_block.c();
    			t3 = space();
    			a = element("a");
    			t4 = text("View on GitHub");
    			t5 = space();
    			p = element("p");
    			t6 = text(t6_value);
    			if (!src_url_equal(img.src, img_src_value = /*list*/ ctx[4].URL)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*list*/ ctx[4].LABEL);
    			attr_dev(img, "class", "project-img svelte-1jzhpuf");
    			add_location(img, file$4, 16, 20, 571);
    			attr_dev(h4, "class", "svelte-1jzhpuf");
    			add_location(h4, file$4, 17, 20, 650);
    			attr_dev(a, "href", /*list*/ ctx[4].PROJECT_URL);
    			add_location(a, file$4, 22, 24, 911);
    			attr_dev(div0, "class", "link-detail svelte-1jzhpuf");
    			add_location(div0, file$4, 18, 20, 692);
    			add_location(p, file$4, 24, 20, 1004);
    			attr_dev(div1, "class", "col-md-4 project svelte-1jzhpuf");
    			add_location(div1, file$4, 15, 16, 520);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, h4);
    			append_dev(h4, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div0, t3);
    			append_dev(div0, a);
    			append_dev(a, t4);
    			append_dev(div1, t5);
    			append_dev(div1, p);
    			append_dev(p, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (/*list*/ ctx[4].APP_STORE_URL !== "") if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(15:12) {#each PROJECT_LIST as list}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let section;
    	let div2;
    	let h2;
    	let t1;
    	let div1;
    	let t2;
    	let div0;
    	let a0;
    	let t4;
    	let a1;
    	let t6;
    	let a2;
    	let each_value = /*PROJECT_LIST*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = `${/*HEADING*/ ctx[0]}`;
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Note:";
    			t4 = space();
    			a1 = element("a");
    			a1.textContent = `${/*NOTE*/ ctx[2]}`;
    			t6 = space();
    			a2 = element("a");
    			a2.textContent = "My\n            Resume";
    			attr_dev(h2, "class", "title svelte-1jzhpuf");
    			add_location(h2, file$4, 12, 8, 391);
    			attr_dev(a0, "class", "note note-leading svelte-1jzhpuf");
    			add_location(a0, file$4, 28, 16, 1107);
    			attr_dev(a1, "class", "note note-trailing svelte-1jzhpuf");
    			add_location(a1, file$4, 28, 55, 1146);
    			add_location(div0, file$4, 27, 12, 1085);
    			attr_dev(div1, "class", "row section-body");
    			add_location(div1, file$4, 13, 8, 432);
    			attr_dev(a2, "class", "btn btn-primary round-border main-bgcolor svelte-1jzhpuf");
    			attr_dev(a2, "href", "./downloads/Resume.pdf");
    			attr_dev(a2, "download", "GavinRyderResume");
    			add_location(a2, file$4, 32, 8, 1231);
    			attr_dev(div2, "class", "container text-center");
    			add_location(div2, file$4, 11, 4, 347);
    			attr_dev(section, "id", "projects");
    			attr_dev(section, "class", "section svelte-1jzhpuf");
    			add_location(section, file$4, 10, 0, 303);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div2);
    			append_dev(div2, h2);
    			append_dev(div2, t1);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t4);
    			append_dev(div0, a1);
    			append_dev(div2, t6);
    			append_dev(div2, a2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*PROJECT_LIST*/ 2) {
    				each_value = /*PROJECT_LIST*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Projects', slots, []);
    	let { projectData = {} } = $$props;
    	const { HEADING, PROJECT_LIST, NOTE } = projectData;
    	const writable_props = ['projectData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('projectData' in $$props) $$invalidate(3, projectData = $$props.projectData);
    	};

    	$$self.$capture_state = () => ({ projectData, HEADING, PROJECT_LIST, NOTE });

    	$$self.$inject_state = $$props => {
    		if ('projectData' in $$props) $$invalidate(3, projectData = $$props.projectData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [HEADING, PROJECT_LIST, NOTE, projectData];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { projectData: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get projectData() {
    		throw new Error("<Projects>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectData(value) {
    		throw new Error("<Projects>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/About/About.svelte generated by Svelte v3.59.2 */

    const file$3 = "src/Components/About/About.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (17:20) {#each ABOUT_ME_LIST as list}
    function create_each_block$2(ctx) {
    	let li;
    	let t_value = /*list*/ ctx[5] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "svelte-1cdfyzs");
    			add_location(li, file$3, 17, 24, 656);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(17:20) {#each ABOUT_ME_LIST as list}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let section;
    	let div3;
    	let h2;
    	let t1;
    	let div2;
    	let div0;
    	let h3;
    	let t3;
    	let ul;
    	let t4;
    	let div1;
    	let img;
    	let img_src_value;
    	let each_value = /*ABOUT_ME_LIST*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			h2 = element("h2");
    			h2.textContent = `${/*HEADING*/ ctx[0]}`;
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = `${/*TITLE*/ ctx[1]}`;
    			t3 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div1 = element("div");
    			img = element("img");
    			attr_dev(h2, "class", "title text-center svelte-1cdfyzs");
    			add_location(h2, file$3, 11, 8, 389);
    			attr_dev(h3, "class", "about-title svelte-1cdfyzs");
    			add_location(h3, file$3, 14, 16, 524);
    			attr_dev(ul, "class", "svelte-1cdfyzs");
    			add_location(ul, file$3, 15, 16, 577);
    			attr_dev(div0, "class", "col-md-6");
    			add_location(div0, file$3, 13, 12, 485);
    			if (!src_url_equal(img.src, img_src_value = /*IMAGE_URL*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "img-fluid about-img svelte-1cdfyzs");
    			add_location(img, file$3, 22, 16, 792);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$3, 21, 12, 753);
    			attr_dev(div2, "class", "row section-body");
    			add_location(div2, file$3, 12, 8, 442);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$3, 10, 4, 357);
    			attr_dev(section, "id", "about");
    			attr_dev(section, "class", "section grey-bgcolor svelte-1cdfyzs");
    			add_location(section, file$3, 9, 0, 303);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, h2);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(div0, t3);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}

    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*ABOUT_ME_LIST*/ 8) {
    				each_value = /*ABOUT_ME_LIST*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	let { aboutData = {} } = $$props;
    	const { HEADING, TITLE, IMAGE_URL, ABOUT_ME_LIST } = aboutData;
    	const writable_props = ['aboutData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('aboutData' in $$props) $$invalidate(4, aboutData = $$props.aboutData);
    	};

    	$$self.$capture_state = () => ({
    		aboutData,
    		HEADING,
    		TITLE,
    		IMAGE_URL,
    		ABOUT_ME_LIST
    	});

    	$$self.$inject_state = $$props => {
    		if ('aboutData' in $$props) $$invalidate(4, aboutData = $$props.aboutData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [HEADING, TITLE, IMAGE_URL, ABOUT_ME_LIST, aboutData];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { aboutData: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get aboutData() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set aboutData(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Experience/Experience.svelte generated by Svelte v3.59.2 */

    const file$2 = "src/Components/Experience/Experience.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (15:12) {#each EXPERIENCE_LIST as list}
    function create_each_block$1(ctx) {
    	let div;
    	let p0;
    	let t0_value = /*list*/ ctx[3].DESCRIPTION + "";
    	let t0;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let p1;
    	let b;
    	let t3_value = /*list*/ ctx[3].NAME + "";
    	let t3;
    	let t4;
    	let br0;
    	let t5;
    	let t6_value = /*list*/ ctx[3].DESIGNATION + "";
    	let t6;
    	let t7;
    	let br1;
    	let t8;
    	let i;
    	let t9_value = /*list*/ ctx[3].DATE + "";
    	let t9;
    	let t10;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			p1 = element("p");
    			b = element("b");
    			t3 = text(t3_value);
    			t4 = space();
    			br0 = element("br");
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = space();
    			br1 = element("br");
    			t8 = space();
    			i = element("i");
    			t9 = text(t9_value);
    			t10 = space();
    			add_location(p0, file$2, 16, 20, 602);
    			if (!src_url_equal(img.src, img_src_value = /*list*/ ctx[3].IMAGE_URL)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-xsu32f");
    			add_location(img, file$2, 17, 20, 648);
    			add_location(b, file$2, 19, 24, 759);
    			add_location(br0, file$2, 20, 24, 802);
    			add_location(br1, file$2, 22, 24, 876);
    			add_location(i, file$2, 23, 24, 907);
    			attr_dev(p1, "class", "experience-details svelte-xsu32f");
    			add_location(p1, file$2, 18, 20, 704);
    			attr_dev(div, "class", "col-md-5 experience svelte-xsu32f");
    			add_location(div, file$2, 15, 16, 548);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(div, t1);
    			append_dev(div, img);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, b);
    			append_dev(b, t3);
    			append_dev(p1, t4);
    			append_dev(p1, br0);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(p1, br1);
    			append_dev(p1, t8);
    			append_dev(p1, i);
    			append_dev(i, t9);
    			append_dev(div, t10);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(15:12) {#each EXPERIENCE_LIST as list}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section;
    	let div1;
    	let h2;
    	let t1;
    	let div0;
    	let each_value = /*EXPERIENCE_LIST*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = `${/*HEADING*/ ctx[0]}`;
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "title text-center svelte-xsu32f");
    			add_location(h2, file$2, 12, 8, 395);
    			attr_dev(div0, "class", "row offset-1 section-body");
    			add_location(div0, file$2, 13, 8, 448);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$2, 11, 4, 363);
    			attr_dev(section, "id", "work-experience");
    			attr_dev(section, "class", "section");
    			add_location(section, file$2, 10, 0, 312);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*EXPERIENCE_LIST*/ 2) {
    				each_value = /*EXPERIENCE_LIST*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Experience', slots, []);
    	let { experienceData = {} } = $$props;
    	const { HEADING, EXPERIENCE_LIST } = experienceData;
    	const writable_props = ['experienceData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Experience> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('experienceData' in $$props) $$invalidate(2, experienceData = $$props.experienceData);
    	};

    	$$self.$capture_state = () => ({ experienceData, HEADING, EXPERIENCE_LIST });

    	$$self.$inject_state = $$props => {
    		if ('experienceData' in $$props) $$invalidate(2, experienceData = $$props.experienceData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [HEADING, EXPERIENCE_LIST, experienceData];
    }

    class Experience extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { experienceData: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Experience",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get experienceData() {
    		throw new Error("<Experience>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set experienceData(value) {
    		throw new Error("<Experience>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Social/Social.svelte generated by Svelte v3.59.2 */

    const file$1 = "src/Components/Social/Social.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (14:12) {#each IMAGES_LIST as list}
    function create_each_block(ctx) {
    	let a;
    	let img;
    	let img_src_value;
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			img = element("img");
    			t = space();
    			if (!src_url_equal(img.src, img_src_value = /*list*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Social media " + /*list*/ ctx[3]);
    			attr_dev(img, "class", "svelte-1nsh6pi");
    			add_location(img, file$1, 18, 20, 718);
    			attr_dev(a, "href", "https://www.linkedin.com/in/gavin-ryder/");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noreferrer");
    			attr_dev(a, "class", "svelte-1nsh6pi");
    			add_location(a, file$1, 14, 16, 541);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, img);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(14:12) {#each IMAGES_LIST as list}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let section;
    	let div1;
    	let h2;
    	let t1;
    	let div0;
    	let each_value = /*IMAGES_LIST*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = `${/*HEADING*/ ctx[1]}`;
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "title text-center");
    			add_location(h2, file$1, 11, 8, 392);
    			attr_dev(div0, "class", "social-icons section-body svelte-1nsh6pi");
    			add_location(div0, file$1, 12, 8, 445);
    			attr_dev(div1, "class", "container text-center");
    			add_location(div1, file$1, 10, 4, 348);
    			attr_dev(section, "id", "social-media");
    			attr_dev(section, "class", "section grey-bgcolor");
    			add_location(section, file$1, 9, 0, 287);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*IMAGES_LIST*/ 1) {
    				each_value = /*IMAGES_LIST*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Social', slots, []);
    	let { socialData = {} } = $$props;
    	const { IMAGES_LIST, HEADING } = socialData;
    	const writable_props = ['socialData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Social> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('socialData' in $$props) $$invalidate(2, socialData = $$props.socialData);
    	};

    	$$self.$capture_state = () => ({ socialData, IMAGES_LIST, HEADING });

    	$$self.$inject_state = $$props => {
    		if ('socialData' in $$props) $$invalidate(2, socialData = $$props.socialData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [IMAGES_LIST, HEADING, socialData];
    }

    class Social extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { socialData: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Social",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get socialData() {
    		throw new Error("<Social>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socialData(value) {
    		throw new Error("<Social>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Footer/Footer.svelte generated by Svelte v3.59.2 */

    const file = "src/Components/Footer/Footer.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let img;
    	let img_src_value;
    	let t0;
    	let div4;
    	let div3;
    	let div1;
    	let div0;
    	let t1;
    	let t2;
    	let div2;
    	let p0;
    	let t4;
    	let a;
    	let p1;
    	let i;
    	let t5;
    	let t6;

    	const block = {
    		c: function create() {
    			section = element("section");
    			img = element("img");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t1 = text(/*header*/ ctx[0]);
    			t2 = space();
    			div2 = element("div");
    			p0 = element("p");
    			p0.textContent = `${/*HEADING*/ ctx[1]}`;
    			t4 = space();
    			a = element("a");
    			p1 = element("p");
    			i = element("i");
    			t5 = space();
    			t6 = text(/*EMAIL*/ ctx[2]);
    			if (!src_url_equal(img.src, img_src_value = "images/wave2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "wave-img svelte-wtopip");
    			add_location(img, file, 15, 4, 430);
    			attr_dev(div0, "class", "dark-name");
    			add_location(div0, file, 19, 16, 614);
    			attr_dev(div1, "class", "col-md-4 footer-box");
    			add_location(div1, file, 18, 12, 564);
    			attr_dev(p0, "class", "footer-title svelte-wtopip");
    			add_location(p0, file, 23, 16, 777);
    			attr_dev(i, "class", "fas fa-envelope");
    			add_location(i, file, 26, 20, 916);
    			add_location(p1, file, 25, 16, 892);
    			attr_dev(a, "href", "mailto:gavin.ryder.dev@icloud.com");
    			add_location(a, file, 24, 16, 831);
    			attr_dev(div2, "class", "col-md-4 footer-box");
    			add_location(div2, file, 22, 12, 727);
    			attr_dev(div3, "class", "row section-body");
    			add_location(div3, file, 17, 8, 521);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file, 16, 4, 489);
    			attr_dev(section, "class", "main-bgcolor light-color");
    			attr_dev(section, "id", "footer");
    			add_location(section, file, 14, 0, 371);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, img);
    			append_dev(section, t0);
    			append_dev(section, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, p0);
    			append_dev(div2, t4);
    			append_dev(div2, a);
    			append_dev(a, p1);
    			append_dev(p1, i);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*header*/ 1) set_data_dev(t1, /*header*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	let { footerData = {} } = $$props;
    	let { header = "" } = $$props;
    	const { CONTACT_DETAILS } = footerData;
    	const { HEADING, EMAIL } = CONTACT_DETAILS;
    	const writable_props = ['footerData', 'header'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('footerData' in $$props) $$invalidate(3, footerData = $$props.footerData);
    		if ('header' in $$props) $$invalidate(0, header = $$props.header);
    	};

    	$$self.$capture_state = () => ({
    		footerData,
    		header,
    		CONTACT_DETAILS,
    		HEADING,
    		EMAIL
    	});

    	$$self.$inject_state = $$props => {
    		if ('footerData' in $$props) $$invalidate(3, footerData = $$props.footerData);
    		if ('header' in $$props) $$invalidate(0, header = $$props.header);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [header, HEADING, EMAIL, footerData];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { footerData: 3, header: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get footerData() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set footerData(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get header() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**src/Data/data.js**/
    const HEADER = "Gavin Ryder";

    const NAVBAR_DATA = [
        { id: 1, url: "#", label: "Home" },
        { id: 2, url: "#projects", label: "Projects" },
        { id: 3, url: "#work-experience", label: "Experience" },
        { id: 4, url: "#about", label: "About Me" },
        { id: 5, url: "#footer", label: "Contact" }
    ];
    const BANNER_DATA = {
        HEADING: "Hey there, I'm Gavin 👋",
        DESCRIPTION:
            "Software Engineer @ Apple",
        GITHUB_URL:
            "https://github.com/gryder8",
        VISIT_GITHUB: "GitHub",
        LINKEDIN_URL: "https://www.linkedin.com/in/gavin-ryder/",
        VISIT_LINKEDIN: "LinkedIn"
    };
    const PROJECT_DATA = {
        HEADING: "Projects",
        ALL_PROJECTS: "All Experience",
        PROJECT_LIST: [
            {
                LABEL: "SCU Food Reviews",
                PROJECT_URL: "https://github.com/gryder8/SCU-Food-Reviews",
                APP_STORE_URL: "https://apps.apple.com/us/app/scu-food-reviews/id6445863241",
                DESCRIPTION:
                    "Using Swift and SwiftUI, I made an iOS App that interfaces with an AWS SAM backend and supports Google Sign-In to allow SCU students to rate food offered on campus.",
                URL: "images/foodreviewsicon.png"
            },
            {
                LABEL: "MLB The Show Flips",
                PROJECT_URL: "https://github.com/gryder8/MLB-The-Show-Flips-App",
                APP_STORE_URL: "",
                DESCRIPTION:
                    "Using SwiftUI and async/await with Swift 5.5, I built an iOS application to help players determine which cards on the market were the most profitable to flip using MLB The Show's Market REST API.",
                URL: "images/MLBTS-Flips.png"
            },
            {
                LABEL: "Pocket Workout Timer",
                PROJECT_URL: "https://github.com/gryder8/WorkoutTimer",
                APP_STORE_URL: "https://apps.apple.com/us/app/pocket-workout-timer/id1532840175",
                DESCRIPTION:
                    "Used Swift and UIKit to build an app that lets you customize and time your workout routine, with customizable sounds and UI colors.",
                URL: "images/WorkoutAppIcon.png"
            },
            {
                LABEL: "SwiftUI Wordle",
                PROJECT_URL: "https://github.com/gryder8/Wordle",
                APP_STORE_URL: "",
                DESCRIPTION: "Cloned from an existing project, I fixed bugs and added additional functionality such as hints.",
                URL: "images/WordleIcon.png"
            },
            {
                LABEL: "Risky Roads",
                PROJECT_URL: "https://github.com/gryder8/Risky-Roads",
                APP_STORE_URL: "",
                DESCRIPTION: "Project made during INRIX Hacks 2021 which uses Flask backend and Swift frontend to pass route data to an iOS app to show the user the fastest and safest route between 2 destinations.",
                URL: "images/roads.png"
            },
            {
                LABEL: "LAHS Bell Timer",
                PROJECT_URL: "https://github.com/gryder8/BellTimer",
                APP_STORE_URL: "https://apps.apple.com/us/app/lahs-bell-timer/id1460500252",
                DESCRIPTION:
                    "Back in high school, I made this app which shows a countdown to the next bell. It uses files hosted on a server and a local cache to get the latest information.",
                URL: "images/BellTimerIcon.png"
            }
        ],
        NOTE: "I've also built an iOS app for a client using SwiftUI, but the details of that are under an NDA and the code is not public."
    };

    const EXPERIENCE_DATA = {
        HEADING: "Work Experience",
        EXPERIENCE_LIST: [
            {
                DESCRIPTION:
                    "Applications – Journal",
                IMAGE_URL: "images/apple-logo.jpeg",
                NAME: "Apple",
                DESIGNATION: "Software Engineer",
                DATE: "September 2024 - Present"
            },
            {
                DESCRIPTION:
                    "Working as an iOS Assistant, contributing small bug fixes and improvements. Added unit tests to back them and prevent regressions. Using UIKit, Swift and XCTest.",
                IMAGE_URL: "images/quizlet-logo.jpeg",
                NAME: "Quizlet",
                DESIGNATION: "Assistant iOS Engineer",
                DATE: "September 2023 - June 2024"
            },
            {
                DESCRIPTION:
                    "Worked in the Applications Special Projects Group on Journal. Used Swift, UIKit, and some CoreData. Also contributed numerous bug fixes and small features into production and worked on an exploratory project.",
                IMAGE_URL: "images/apple-logo.jpeg",
                NAME: "Apple",
                DESIGNATION: "Software Engineering Intern",
                DATE: "June 2023 - September 2023"
            },
            {
                DESCRIPTION:
                    "Worked in the Applications Special Projects Group on Journal, using Swift and SwiftUI as well as some CoreData and Combine.",
                IMAGE_URL: "images/apple-logo.jpeg",
                NAME: "Apple",
                DESIGNATION: "Software Engineering Intern",
                DATE: "June 2022 - September 2022"
            },
            {
                DESCRIPTION:
                    "Part of a student and faculty led startup to make dance education more accessible using IoT wearables.",
                IMAGE_URL: "images/swing-beats-icon.jpeg",
                NAME: "Swingbeats",
                DESIGNATION: "iOS Lead",
                DATE: "2022 - 2023"
            },
            {
                DESCRIPTION:
                    "Remotely managed a team of 7 interns, planning sprints and delegating development work to myself and others.",
                IMAGE_URL: "images/real-estate-logo.jpeg",
                NAME: "Real Estate Dashboard Inc.",
                DESIGNATION: "Lead iOS Intern",
                DATE: "2021"
            }
        ],
    };

    const ABOUT_DATA = {
        HEADING: "About Me",
        TITLE: "A little more about me",
        IMAGE_URL: "images/portrait.png",
        ABOUT_ME_LIST: [
            "🎓 I graduated from Santa Clara University in 2024 with a B.S. in Computer Science and Engineering",
            "🧑🏻‍💻 My favorite programming language is Swift, but I also know Java and some C++",
            "🌉 I'm from the SF Bay Area",
            "🏋 In my free time, I like to exercise, hang out with friends, listen to music, cook, or play video games",
            "🎿 I also love to ski, as well as watch baseball and Formula 1",
        ]
    };


    const FOOTER_DATA = {
        DESCRIPTION:
            "If you're interested in working with me or reaching out to me about an opportunity you can reach me here:",
        CONTACT_DETAILS: {
            HEADING: "Contact Me",
            EMAIL: "gavin.ryder.dev@icloud.com"
        }
    };

    const ALL_DATA = {
        HEADER,
        NAVBAR_DATA,
        BANNER_DATA,
        PROJECT_DATA,
        ABOUT_DATA,
        EXPERIENCE_DATA,
        FOOTER_DATA
    };

    /* src/App.svelte generated by Svelte v3.59.2 */

    function create_fragment(ctx) {
    	let navbar;
    	let t0;
    	let banner;
    	let t1;
    	let projects;
    	let t2;
    	let experience;
    	let t3;
    	let about;
    	let t4;
    	let footer;
    	let current;

    	navbar = new Navbar({
    			props: {
    				navlists: ALL_DATA.NAVBAR_DATA,
    				header: ALL_DATA.HEADER
    			},
    			$$inline: true
    		});

    	banner = new Banner({
    			props: { bannerData: ALL_DATA.BANNER_DATA, "}": true },
    			$$inline: true
    		});

    	projects = new Projects({
    			props: { projectData: ALL_DATA.PROJECT_DATA },
    			$$inline: true
    		});

    	experience = new Experience({
    			props: { experienceData: ALL_DATA.EXPERIENCE_DATA },
    			$$inline: true
    		});

    	about = new About({
    			props: { aboutData: ALL_DATA.ABOUT_DATA },
    			$$inline: true
    		});

    	footer = new Footer({
    			props: {
    				footerData: ALL_DATA.FOOTER_DATA,
    				header: ALL_DATA.HEADER
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(banner.$$.fragment);
    			t1 = space();
    			create_component(projects.$$.fragment);
    			t2 = space();
    			create_component(experience.$$.fragment);
    			t3 = space();
    			create_component(about.$$.fragment);
    			t4 = space();
    			create_component(footer.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(banner, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(projects, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(experience, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(about, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(banner.$$.fragment, local);
    			transition_in(projects.$$.fragment, local);
    			transition_in(experience.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(banner.$$.fragment, local);
    			transition_out(projects.$$.fragment, local);
    			transition_out(experience.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(banner, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(projects, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(experience, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(about, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Navbar,
    		Banner,
    		Projects,
    		About,
    		Experience,
    		Social,
    		Footer,
    		DATA: ALL_DATA
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
