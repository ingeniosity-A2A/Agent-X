/**
 * sidebar-tree.js — official agent-browser sidebar (uploaded attachment)
 * ======================================================================
 * Visual + behavior: responsive-pinned-sidebar-layout-w-popover, AS-IS.
 * (sidebar/sidebar.css is byte-identical from the upload zip; this script
 * is the attachment's script.js with ONLY the demo config panel removed —
 * tweakpane/GSAP was demo tooling, not part of the sidebar.)
 *
 * Re-edited with the actual information (never redesigned):
 *   - ESA is ONE TAB here. Its dropdown = the real ESA service cards
 *     + Calendar. Choosing one renders it in the viewport.
 *   - The attachment's own tabs (Introduction, Getting Started,
 *     The Checklist, Requests, Foundations, Studio, Horizon...) are all
 *     restored. "The Checklist" + "Requests" wire to the real cards.
 *   - Tree expand/collapse uses the attachment's grid transitions
 *     (grid-template-rows 0fr -> 1fr + blur/translate/opacity).
 */
(function () {
  // ---- config defaults (attachment tweakpane values, applied directly) ----
  const root = document.documentElement;
  root.dataset.theme = 'dark';
  root.dataset.delay = 'true';
  root.dataset.triangle = 'true';
  root.dataset.show = 'true';
  root.style.setProperty('--layout-speed', '0.16');
  root.style.setProperty('--duration', '0.18');
  root.style.setProperty('--opacity', '0.4');
  root.style.setProperty('--blur', '10');
  root.style.setProperty('--translate', '12');

  // ---- Tree navigation data (attachment structure, actual information) ----
  const TREE_DATA = {
    label: 'Agent Browser',
    groups: [
      {
        title: 'Base',
        items: [
          {
            id: 'esa',
            label: 'ESA',
            href: '#esa',
            items: [
              { id: 'card-diagnostic', label: 'Diagnostic', href: '#card-diagnostic', card: 'esa-diagnostics', current: true },
              { id: 'card-parts', label: 'Parts', href: '#card-parts', card: 'esa-parts-card' },
              { id: 'card-workorder', label: 'Workorder', href: '#card-workorder', card: 'esa-workorder' },
              { id: 'card-checklist', label: 'Checklist', href: '#card-checklist', card: 'esa-maintenance-checklist' },
              { id: 'card-ptac', label: 'PTAC Broadcast', href: '#card-ptac', card: 'esa-ptac' },
              { id: 'card-calendar', label: 'Calendar', href: '#card-calendar', card: 'esa-calendar' }
            ]
          },
          { id: 'introduction', label: 'Introduction', href: '#introduction' },
          { id: 'getting-started', label: 'Getting Started', href: '#getting-started' },
          { id: 'checklist', label: 'The Checklist', href: '#checklist', card: 'esa-maintenance-checklist' },
          { id: 'requests', label: 'Requests', href: '#requests', card: 'esa-workorder' }
        ]
      },
      {
        title: 'Modules',
        items: [
          {
            id: 'foundations',
            label: 'Foundations',
            href: '#foundations',
            items: [
              { id: 'overview', label: 'Overview', href: '#overview' },
              {
                id: 'css-animation',
                label: 'CSS Animation',
                href: '#css-animation',
                items: [
                  { id: 'css-animation-anatomy', label: 'Anatomy', href: '#css-animation-anatomy' },
                  { id: 'first-keyframe', label: 'Keyframes', href: '#keyframes' },
                  { id: 'delays', label: 'Delays', href: '#delays' }
                ]
              },
              {
                id: 'svg-filters',
                label: 'SVG Filters',
                href: '#svg-filters',
                items: [
                  { id: 'svg-filter-anatomy', label: 'Anatomy', href: '#svg-filter-anatomy' },
                  { id: 'goo', label: 'Goo', href: '#goo' },
                  { id: 'noise', label: 'Noise', href: '#noise' }
                ]
              },
              {
                id: 'canvas',
                label: 'Canvas',
                href: '#canvas',
                items: [
                  { id: 'canvas-anatomy', label: 'Anatomy', href: '#canvas-anatomy' },
                  { id: 'particles', label: 'Particles', href: '#particles' },
                  { id: 'projection', label: 'Projection', href: '#projection' }
                ]
              }
            ]
          },
          {
            id: 'studio',
            label: 'Studio',
            href: '#studio',
            items: [
              { id: 'tri-toggle', label: 'Tri-Toggle', href: '#tri-toggle' },
              {
                id: 'liquid-glass',
                label: 'Liquid Glass',
                href: '#liquid-glass',
                items: [
                  { id: 'liquid-displacement', label: 'Displacement', href: '#liquid-displacement' },
                  { id: 'liquid-toggle', label: 'Toggle', href: '#liquid-toggle' },
                  { id: 'liquid-slider', label: 'Slider', href: '#liquid-slider' }
                ]
              },
              { id: 'bear-toggle', label: 'Bear toggle', href: '#bear-toggle' },
              { id: 'you-can-scroll', label: 'You can scroll', href: '#you-can-scroll' },
              { id: 'split-flap-display', label: '3D Split Flap', href: '#split-flap-display' },
              { id: 'signature-flow', label: 'Signature flow', href: '#signature-flow' }
            ]
          },
          {
            id: 'horizon',
            label: 'Horizon',
            href: '#horizon',
            items: [
              { id: 'scroll-markers', label: ':scroll-marker-group', href: '#scroll-markers' },
              { id: 'css-scroll-animation', label: 'Scroll-driven Animation', href: '#css-scroll-animation' },
              { id: 'starting-style', label: '@starting-style', href: '#starting-style' },
              { id: 'details-content', label: '::details-content', href: '#details-content' },
              { id: 'styleable-select', label: 'Styleable Select', href: '#styleable-select' },
              { id: 'view-transitions', label: 'View Transitions', href: '#view-transitions' },
              { id: 'scroll-target-group', label: 'scroll-target-group', href: '#scroll-target-group' },
              { id: 'stuck', label: ':stuck', href: '#stuck' }
            ]
          }
        ]
      }
    ]
  };

  // ---- attachment: generateTreeHTML (verbatim + data-esa-open hook) ----
  function generateTreeHTML(data) {
    const processItems = (items, level = 1, parentId = null) => {
      const setSize = items.length;
      const htmlParts = [];

      items.forEach((item, index) => {
        const posInSet = index + 1;
        const hasChildren = item.items && item.items.length > 0;
        const itemId = `tree-item-${item.id}`;
        const groupId = hasChildren ? `tree-group-${item.id}` : null;

        let html = `<li role="none">`;
        html += `<a
          id="${itemId}"
          role="treeitem"
          href="${item.href || '#'}"
          tabindex="${item.current ? '0' : '-1'}"
          aria-level="${level}"
          aria-setsize="${setSize}"
          aria-posinset="${posInSet}"
          ${item.current ? 'aria-current="page"' : ''}
          ${item.card ? `data-esa-open="${item.card}"` : ''}
          ${hasChildren ? `aria-expanded="false" aria-owns="${groupId}"` : ''}
        >`;

        html += `<span>${item.label}</span>`;

        if (hasChildren) {
          html += `<span class="tree-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          </span>
          `;
        }

        html += `</a>`;

        if (hasChildren) {
          html += `<div inert>`;
          html += `<ul id="${groupId}" role="group">`;
          html += processItems(item.items, level + 1, itemId);
          html += `</ul>`;
          html += `</div>`;
        }

        html += `</li>`;
        htmlParts.push(html);
      });

      return htmlParts.join('');
    };

    if (data.groups) {
      let treeHTML = `<ul role="tree" aria-label="${data.label}">`;

      data.groups.forEach((group, groupIndex) => {
        const groupId = `tree-group-toplevel-${groupIndex}`;
        treeHTML += `<li role="none" class="tree-group-container">`;
        treeHTML += `<ul role="group" id="${groupId}">`;
        treeHTML += processItems(group.items);
        treeHTML += `</ul>`;
        treeHTML += `</li>`;
      });

      treeHTML += `</ul>`;
      return treeHTML;
    }

    return `
      <ul role="tree" aria-label="${data.label}">
        ${processItems(data.items || [])}
      </ul>
    `;
  }

  document.querySelector('sidebar-tree').innerHTML = generateTreeHTML(TREE_DATA);

  // ---- attachment: SidebarTree custom element (verbatim) ----
  class SidebarTree extends HTMLElement {
    constructor() {
      super();
      this.currentFocus = null;
      this.nodeMap = new Map();
    }

    resetTabIndexes() {
      this.tree.querySelectorAll('[role="treeitem"]').forEach(el => {
        el.setAttribute('tabindex', '-1');
      });
    }

    setFocusToItem(item, updateTabindex = true) {
      if (!item) return;

      if (updateTabindex) {
        this.resetTabIndexes();
        item.setAttribute('tabindex', '0');
      }

      item.focus();
      this.currentFocus = item;
    }

    isExpanded(item) {
      return item.getAttribute('aria-expanded') === 'true';
    }

    findParentTreeItem(childElement) {
      const parentGroup = childElement.closest('ul[role="group"][id]');
      if (parentGroup && parentGroup.id.startsWith('tree-group-') && !parentGroup.id.includes('toplevel')) {
        return this.querySelector(`[aria-owns="${parentGroup.id}"]`);
      }
      return null;
    }

    getGroupFromItem(item) {
      const groupId = item.getAttribute('aria-owns');
      return groupId ? document.getElementById(groupId) : null;
    }

    connectedCallback() {
      this.tree = this.querySelector('[role="tree"]');
      this.buildNodeMap();
      this.setupEventListeners();
      this.initializeFocus();
    }

    buildNodeMap() {
      const allTreeItems = this.querySelectorAll('[role="treeitem"]');

      allTreeItems.forEach(item => {
        const parentItem = this.findParentTreeItem(item);

        this.nodeMap.set(item.id, {
          id: item.id,
          level: parseInt(item.getAttribute('aria-level')),
          hasChildren: item.hasAttribute('aria-expanded'),
          parentId: parentItem?.id || null,
          label: item.textContent.trim()
        });
      });
    }

    setupEventListeners() {
      this.tree.addEventListener('click', this.handleClick.bind(this));
      this.tree.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    initializeFocus() {
      const currentItem = this.tree.querySelector('[aria-current="page"]');
      this.currentFocus = currentItem || this.tree.querySelector('[role="treeitem"]');

      if (currentItem) {
        this.ensureItemVisible(currentItem);
      }
    }

    handleClick(event) {
      const treeItem = event.target.closest('[role="treeitem"]');
      if (!treeItem) return;

      const icon = event.target.closest('.tree-icon');

      if (icon && treeItem.hasAttribute('aria-expanded')) {
        event.preventDefault();
        this.toggleExpanded(treeItem);
      } else if (!icon) {
        this.activateItem(treeItem);
      }
    }

    handleKeydown(event) {
      const treeItem = event.target.closest('[role="treeitem"]');
      if (!treeItem) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          this.activateItem(treeItem);
          treeItem.click();
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.focusNextItem(treeItem);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.focusPreviousItem(treeItem);
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.handleRightArrow(treeItem);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.handleLeftArrow(treeItem);
          break;
        case 'Home':
          event.preventDefault();
          this.focusFirstItem();
          break;
        case 'End':
          event.preventDefault();
          this.focusLastItem();
          break;
        case '*':
          event.preventDefault();
          this.expandAllSiblings(treeItem);
          break;
        default:
          if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
            event.preventDefault();
            this.focusItemByFirstChar(event.key.toLowerCase());
          }
      }
    }

    toggleExpanded(item) {
      const wasExpanded = this.isExpanded(item);
      const group = this.getGroupFromItem(item);

      if (group) {
        const wrapper = group.parentElement;
        item.setAttribute('aria-expanded', !wasExpanded);

        if (wasExpanded) {
          wrapper.setAttribute('inert', '');
        } else {
          wrapper.removeAttribute('inert');
        }

        const icon = item.querySelector('.tree-icon svg');
      }
    }

    activateItem(item) {
      this.tree.querySelectorAll('[aria-current="page"]').forEach(el => {
        el.removeAttribute('aria-current');
      });

      item.setAttribute('aria-current', 'page');

      this.resetTabIndexes();
      item.setAttribute('tabindex', '0');
    }

    focusItem(item) {
      this.setFocusToItem(item);
    }

    focusNextItem(current) {
      const allVisible = this.getVisibleItems();
      const currentIndex = allVisible.indexOf(current);
      if (currentIndex < allVisible.length - 1) {
        this.focusItem(allVisible[currentIndex + 1]);
      }
    }

    focusPreviousItem(current) {
      const allVisible = this.getVisibleItems();
      const currentIndex = allVisible.indexOf(current);
      if (currentIndex > 0) {
        this.focusItem(allVisible[currentIndex - 1]);
      }
    }

    handleRightArrow(item) {
      if (item.hasAttribute('aria-expanded')) {
        if (!this.isExpanded(item)) {
          this.toggleExpanded(item);
        } else {
          const group = this.getGroupFromItem(item);
          const firstChild = group?.querySelector('[role="treeitem"]');
          if (firstChild) {
            this.focusItem(firstChild);
          }
        }
      }
    }

    handleLeftArrow(item) {
      const nodeInfo = this.nodeMap.get(item.id);

      if (item.hasAttribute('aria-expanded') && this.isExpanded(item)) {
        this.toggleExpanded(item);
      } else if (nodeInfo.parentId) {
        const parent = document.getElementById(nodeInfo.parentId);
        if (parent) {
          this.focusItem(parent);
        }
      }
    }

    focusFirstItem() {
      const firstItem = this.tree.querySelector('[role="treeitem"]');
      this.focusItem(firstItem);
    }

    focusLastItem() {
      const allVisible = this.getVisibleItems();
      this.focusItem(allVisible[allVisible.length - 1]);
    }

    expandAllSiblings(item) {
      const nodeInfo = this.nodeMap.get(item.id);
      const parent = nodeInfo.parentId ?
        document.getElementById(nodeInfo.parentId).parentElement :
        this.tree;

      parent.querySelectorAll(':scope > li > [aria-expanded="false"]').forEach(sibling => {
        this.toggleExpanded(sibling);
      });
    }

    focusItemByFirstChar(char) {
      const allVisible = this.getVisibleItems();
      const current = document.activeElement;
      const currentIndex = allVisible.indexOf(current);

      for (let i = currentIndex + 1; i < allVisible.length; i++) {
        if (allVisible[i].textContent.toLowerCase().trim().startsWith(char)) {
          this.focusItem(allVisible[i]);
          return;
        }
      }

      for (let i = 0; i <= currentIndex; i++) {
        if (allVisible[i].textContent.toLowerCase().trim().startsWith(char)) {
          this.focusItem(allVisible[i]);
          return;
        }
      }
    }

    getVisibleItems() {
      const items = [];
      const walkTree = (element) => {
        const directItems = element.querySelectorAll(':scope > li > [role="treeitem"]');
        const groupItems = element.querySelectorAll(':scope > li > ul[role="group"] > li > [role="treeitem"]');
        const treeItems = [...directItems, ...groupItems];

        treeItems.forEach(item => {
          items.push(item);
          if (this.isExpanded(item)) {
            const group = this.getGroupFromItem(item);
            if (group) {
              walkTree(group);
            }
          }
        });
      };

      walkTree(this.tree);
      return items;
    }

    ensureItemVisible(item) {
      let parent = item.parentElement;
      while (parent && parent !== this.tree) {
        if (parent.getAttribute('role') === 'group') {
          const wrapper = parent.parentElement;
          if (wrapper && wrapper.hasAttribute('inert')) {
            const parentItem = this.tree.querySelector(`[aria-owns="${parent.id}"]`);
            if (parentItem && !this.isExpanded(parentItem)) {
              this.toggleExpanded(parentItem);
            }
          }
        }
        parent = parent.parentElement;
      }
    }

    filter(searchTerm) {
      const allItems = this.tree.querySelectorAll('[role="treeitem"]');

      if (!searchTerm || searchTerm.length < 3) {
        allItems.forEach(item => {
          item.removeAttribute('data-filtered');
          item.removeAttribute('data-search-match');
          item.removeAttribute('data-search-related');
        });
        this.tree.removeAttribute('data-filtering');

        const allExpandable = this.tree.querySelectorAll('[aria-expanded="true"]');
        allExpandable.forEach(item => {
          this.toggleExpanded(item);
        });

        const currentItem = this.tree.querySelector('[aria-current="page"]');
        if (currentItem) {
          this.ensureItemVisible(currentItem);
        }

        return 0;
      }

      this.tree.setAttribute('data-filtering', 'true');
      const term = searchTerm.toLowerCase();
      const matches = new Set();
      const relatedItems = new Set();

      allItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(term)) {
          matches.add(item);
          item.setAttribute('data-search-match', 'true');

          let parent = item.parentElement;
          while (parent && parent !== this.tree) {
            if (parent.getAttribute('role') === 'group') {
              const parentItem = this.tree.querySelector(`[aria-owns="${parent.id}"]`);
              if (parentItem) {
                relatedItems.add(parentItem);
                if (!this.isExpanded(parentItem)) {
                  this.toggleExpanded(parentItem);
                }
              }
            }
            parent = parent.parentElement;
          }

          if (item.hasAttribute('aria-owns')) {
            const group = this.getGroupFromItem(item);
            if (group) {
              const descendants = group.querySelectorAll('[role="treeitem"]');
              descendants.forEach(desc => relatedItems.add(desc));
              if (!this.isExpanded(item)) {
                this.toggleExpanded(item);
              }
            }
          }
        }
      });

      allItems.forEach(item => {
        if (matches.has(item)) {
          item.removeAttribute('data-filtered');
          item.removeAttribute('data-search-related');
        } else if (relatedItems.has(item)) {
          item.removeAttribute('data-filtered');
          item.removeAttribute('data-search-match');
          item.setAttribute('data-search-related', 'true');
        } else {
          item.removeAttribute('data-search-match');
          item.removeAttribute('data-search-related');
          item.setAttribute('data-filtered', 'true');
        }
      });

      return matches.size;
    }
  }

  customElements.define('sidebar-tree', SidebarTree);

  // ---- attachment: search wiring (verbatim) ----
  const searchInput = document.getElementById('tree-search');
  const sidebarTree = document.querySelector('sidebar-tree');

  function updateSearchAriaLabel(value, matches) {
    const baseLabel = 'Search navigation tree - Press slash to focus';

    if (!value || value.length < 3) {
      searchInput.setAttribute('aria-label', baseLabel);
    } else {
      searchInput.setAttribute('aria-label',
        matches > 0
          ? `Search navigation tree - ${matches} items found - Press slash to focus`
          : 'Search navigation tree - No items found - Press slash to focus'
      );
    }
  }

  if (searchInput && sidebarTree) {
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      const matches = sidebarTree.filter(value);
      updateSearchAriaLabel(value, matches);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.target.value = '';
        sidebarTree.filter('');
        updateSearchAriaLabel('', 0);
      }
    });

    document.addEventListener('keydown', (e) => {
      const tagName = e.target.tagName.toLowerCase();
      const isEditable = e.target.isContentEditable;
      const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';

      if (e.key === '/' && !isInput && !isEditable) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  // ---- actual-information wiring (added, design untouched) ----
  // Tree items marked data-esa-open render the real card in the viewport.
  const sidebarEl = document.getElementById('sidebar');

  function openCardFromTree(cardId) {
    if (window.ESAShell && typeof window.ESAShell.showCard === 'function') {
      window.ESAShell.showCard(cardId);
    }
    if (window.matchMedia('(min-width: 768px)').matches === false) {
      try { if (sidebarEl.hidePopover) sidebarEl.hidePopover(); } catch (_) {}
    }
  }

  if (sidebarEl) {
    sidebarEl.addEventListener('click', (e) => {
      const t = e.target.closest('[data-esa-open]');
      if (!t) return;
      if (e.target.closest('.tree-icon')) return;
      openCardFromTree(t.getAttribute('data-esa-open'));
    });

    // New Request -> real action: open the workorder card
    const newReq = sidebarEl.querySelector('[aria-label="New request"]');
    if (newReq) {
      newReq.addEventListener('click', () => openCardFromTree('esa-workorder'));
    }

    // Feedback / Settings -> surface through the ESA event hub
    const fb = sidebarEl.querySelector('.feedback');
    if (fb) fb.addEventListener('click', () => window.dispatchEvent(new CustomEvent('esa:feedback', { detail: { source: 'sidebar' } })));
    const st = sidebarEl.querySelector('.settings');
    if (st) st.addEventListener('click', () => window.dispatchEvent(new CustomEvent('esa:settings', { detail: { source: 'sidebar' } })));
  }

  // Viewport -> tree selection sync (toolbar arrows change cards too)
  window.addEventListener('esa:card-selected', (e) => {
    const id = e.detail && e.detail.id;
    if (!id || !sidebarTree || !sidebarTree.tree) return;
    const item = sidebarTree.tree.querySelector(`[data-esa-open="${id}"]`);
    if (item && item.getAttribute('aria-current') !== 'page') {
      sidebarTree.activateItem(item);
    }
  });

  // ---- attachment: popover desktop/mobile sync (verbatim) ----
  const sidebar = document.querySelector('aside[popover]');
  const syncPopover = () => {
    const desktop = window.matchMedia('(min-width: 768px)').matches;
    sidebar.setAttribute('popover', desktop ? 'manual' : 'auto');
  };
  window.addEventListener('resize', syncPopover);
  syncPopover();
})();
