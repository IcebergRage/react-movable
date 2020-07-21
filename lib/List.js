"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var ReactDOM = __importStar(require("react-dom"));
var utils_1 = require("./utils");
var AUTOSCROLL_ACTIVE_OFFSET = 200;
var AUTOSCROLL_SPEED_RATIO = 10;
var List = /** @class */ (function (_super) {
    __extends(List, _super);
    function List(props) {
        var _this = _super.call(this, props) || this;
        _this.listRef = React.createRef();
        _this.ghostRef = React.createRef();
        _this.topOffsets = [];
        _this.itemTranslateOffsets = [];
        _this.initialYOffset = 0;
        _this.lastScroll = 0;
        _this.lastYOffset = 0;
        _this.lastListYOffset = 0;
        _this.needle = -1;
        _this.afterIndex = -2;
        _this.state = {
            itemDragged: -1,
            itemDraggedOutOfBounds: -1,
            selectedItem: -1,
            initialX: 0,
            initialY: 0,
            targetX: 0,
            targetY: 0,
            targetHeight: 0,
            targetWidth: 0,
            liveText: '',
            scrollingSpeed: 0,
            scrollWindow: false
        };
        _this.doScrolling = function () {
            var _a = _this.state, scrollingSpeed = _a.scrollingSpeed, scrollWindow = _a.scrollWindow;
            var listEl = _this.listRef.current;
            window.requestAnimationFrame(function () {
                if (scrollWindow) {
                    window.scrollTo(window.pageXOffset, window.pageYOffset + scrollingSpeed * 1.5);
                }
                else {
                    listEl.scrollTop += scrollingSpeed;
                }
                if (scrollingSpeed !== 0) {
                    _this.doScrolling();
                }
            });
        };
        _this.getChildren = function () {
            if (_this.listRef && _this.listRef.current) {
                return Array.from(_this.listRef.current.children);
            }
            console.warn('No items found in the List container. Did you forget to pass & spread the `props` param in renderList?');
            return [];
        };
        _this.calculateOffsets = function () {
            _this.topOffsets = _this.getChildren().map(function (item) { return item.getBoundingClientRect().top; });
            _this.itemTranslateOffsets = _this.getChildren().map(function (item) {
                return utils_1.getTranslateOffset(item);
            });
        };
        _this.getTargetIndex = function (e) {
            return _this.getChildren().findIndex(function (child) { return child === e.target || child.contains(e.target); });
        };
        _this.onMouseOrTouchStart = function (e) {
            if (_this.dropTimeout && _this.state.itemDragged > -1) {
                window.clearTimeout(_this.dropTimeout);
                _this.finishDrop();
            }
            var isTouch = utils_1.isTouchEvent(e);
            if (!isTouch && e.button !== 0)
                return;
            var index = _this.getTargetIndex(e);
            if (index === -1 ||
                // @ts-ignore
                (_this.props.values[index] && _this.props.values[index].disabled))
                return;
            var listItemTouched = _this.getChildren()[index];
            var handle = listItemTouched.querySelector('[data-movable-handle]');
            if (handle && !handle.contains(e.target)) {
                return;
            }
            if (utils_1.checkIfInteractive(e.target, listItemTouched)) {
                return;
            }
            e.preventDefault();
            _this.props.beforeDrag &&
                _this.props.beforeDrag({
                    elements: _this.getChildren(),
                    index: index
                });
            if (isTouch) {
                var opts = { passive: false };
                listItemTouched.style.touchAction = 'none';
                document.addEventListener('touchend', _this.schdOnEnd, opts);
                document.addEventListener('touchmove', _this.schdOnTouchMove, opts);
                document.addEventListener('touchcancel', _this.schdOnEnd, opts);
            }
            else {
                document.addEventListener('mousemove', _this.schdOnMouseMove);
                document.addEventListener('mouseup', _this.schdOnEnd);
                var listItemTouched_1 = _this.getChildren()[_this.state.itemDragged];
                listItemTouched_1.style.touchAction = '';
            }
            _this.onStart(listItemTouched, isTouch ? e.touches[0].clientX : e.clientX, isTouch ? e.touches[0].clientY : e.clientY, index);
        };
        _this.getYOffset = function () {
            var listScroll = _this.listRef.current
                ? _this.listRef.current.scrollTop
                : 0;
            return window.pageYOffset + listScroll;
        };
        _this.onStart = function (target, clientX, clientY, index) {
            if (_this.state.selectedItem > -1) {
                _this.setState({ selectedItem: -1 });
                _this.needle = -1;
            }
            var targetRect = target.getBoundingClientRect();
            var targetStyles = window.getComputedStyle(target);
            _this.calculateOffsets();
            _this.initialYOffset = _this.getYOffset();
            _this.lastYOffset = window.pageYOffset;
            _this.lastListYOffset = _this.listRef.current.scrollTop;
            _this.setState({
                itemDragged: index,
                targetX: targetRect.left - parseInt(targetStyles['margin-left'], 10),
                targetY: targetRect.top - parseInt(targetStyles['margin-top'], 10),
                targetHeight: targetRect.height,
                targetWidth: targetRect.width,
                initialX: clientX,
                initialY: clientY
            });
        };
        _this.onMouseMove = function (e) {
            e.cancelable && e.preventDefault();
            _this.onMove(e.clientX, e.clientY);
        };
        _this.onTouchMove = function (e) {
            e.cancelable && e.preventDefault();
            _this.onMove(e.touches[0].clientX, e.touches[0].clientY);
        };
        _this.onWheel = function (e) {
            if (_this.state.itemDragged < 0)
                return;
            _this.lastScroll = _this.listRef.current.scrollTop += e.deltaY;
            _this.moveOtherItems();
        };
        _this.onMove = function (clientX, clientY) {
            if (_this.state.itemDragged === -1)
                return null;
            utils_1.transformItem(_this.ghostRef.current, clientY - _this.state.initialY, _this.props.lockVertically ? 0 : clientX - _this.state.initialX);
            _this.autoScrolling(clientY);
            _this.moveOtherItems();
        };
        _this.moveOtherItems = function () {
            var targetRect = _this.ghostRef.current.getBoundingClientRect();
            var itemVerticalCenter = targetRect.top + targetRect.height / 2;
            var offset = utils_1.getTranslateOffset(_this.getChildren()[_this.state.itemDragged]);
            var currentYOffset = _this.getYOffset();
            // adjust offsets if scrolling happens during the item movement
            if (_this.initialYOffset !== currentYOffset) {
                _this.topOffsets = _this.topOffsets.map(function (offset) { return offset - (currentYOffset - _this.initialYOffset); });
                _this.initialYOffset = currentYOffset;
            }
            if (_this.isDraggedItemOutOfBounds() && _this.props.removableByMove) {
                _this.afterIndex = _this.topOffsets.length + 1;
            }
            else {
                _this.afterIndex = utils_1.binarySearch(_this.topOffsets, itemVerticalCenter);
            }
            _this.animateItems(_this.afterIndex === -1 ? 0 : _this.afterIndex, _this.state.itemDragged, offset);
        };
        _this.autoScrolling = function (clientY) {
            var _a = _this.listRef.current.getBoundingClientRect(), top = _a.top, bottom = _a.bottom, height = _a.height;
            var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            // autoscrolling for the window (down)
            if (bottom > viewportHeight &&
                viewportHeight - clientY < AUTOSCROLL_ACTIVE_OFFSET) {
                _this.setState({
                    scrollingSpeed: Math.round((AUTOSCROLL_ACTIVE_OFFSET - (viewportHeight - clientY)) /
                        AUTOSCROLL_SPEED_RATIO),
                    scrollWindow: true
                });
                // autoscrolling for the window (up)
            }
            else if (top < 0 && clientY < AUTOSCROLL_ACTIVE_OFFSET) {
                _this.setState({
                    scrollingSpeed: Math.round((AUTOSCROLL_ACTIVE_OFFSET - clientY) / -AUTOSCROLL_SPEED_RATIO),
                    scrollWindow: true
                });
            }
            else {
                if (_this.state.scrollWindow && _this.state.scrollingSpeed !== 0) {
                    _this.setState({ scrollingSpeed: 0, scrollWindow: false });
                }
                // autoscrolling for containers with overflow
                if (height + 20 < _this.listRef.current.scrollHeight) {
                    var scrollingSpeed = 0;
                    if (clientY - top < AUTOSCROLL_ACTIVE_OFFSET) {
                        scrollingSpeed = Math.round((AUTOSCROLL_ACTIVE_OFFSET - (clientY - top)) /
                            -AUTOSCROLL_SPEED_RATIO);
                    }
                    else if (bottom - clientY < AUTOSCROLL_ACTIVE_OFFSET) {
                        scrollingSpeed = Math.round((AUTOSCROLL_ACTIVE_OFFSET - (bottom - clientY)) /
                            AUTOSCROLL_SPEED_RATIO);
                    }
                    if (_this.state.scrollingSpeed !== scrollingSpeed) {
                        _this.setState({ scrollingSpeed: scrollingSpeed });
                    }
                }
            }
        };
        _this.animateItems = function (needle, movedItem, offset, animateMovedItem) {
            if (animateMovedItem === void 0) { animateMovedItem = false; }
            _this.getChildren().forEach(function (item, i) {
                utils_1.setItemTransition(item, _this.props.transitionDuration);
                if (movedItem === i && animateMovedItem) {
                    if (movedItem === needle) {
                        return utils_1.transformItem(item, null);
                    }
                    utils_1.transformItem(item, movedItem < needle
                        ? _this.itemTranslateOffsets
                            .slice(movedItem + 1, needle + 1)
                            .reduce(function (a, b) { return a + b; }, 0)
                        : _this.itemTranslateOffsets
                            .slice(needle, movedItem)
                            .reduce(function (a, b) { return a + b; }, 0) * -1);
                }
                else if (movedItem < needle && i > movedItem && i <= needle) {
                    utils_1.transformItem(item, -offset);
                }
                else if (i < movedItem && movedItem > needle && i >= needle) {
                    utils_1.transformItem(item, offset);
                }
                else {
                    utils_1.transformItem(item, null);
                }
            });
        };
        _this.isDraggedItemOutOfBounds = function () {
            var initialRect = _this.getChildren()[_this.state.itemDragged].getBoundingClientRect();
            var targetRect = _this.ghostRef.current.getBoundingClientRect();
            if (Math.abs(initialRect.left - targetRect.left) > targetRect.width) {
                if (_this.state.itemDraggedOutOfBounds === -1) {
                    _this.setState({ itemDraggedOutOfBounds: _this.state.itemDragged });
                }
                return true;
            }
            if (_this.state.itemDraggedOutOfBounds > -1) {
                _this.setState({ itemDraggedOutOfBounds: -1 });
            }
            return false;
        };
        _this.onEnd = function (e) {
            e.cancelable && e.preventDefault();
            document.removeEventListener('mousemove', _this.schdOnMouseMove);
            document.removeEventListener('touchmove', _this.schdOnTouchMove);
            document.removeEventListener('mouseup', _this.schdOnEnd);
            document.removeEventListener('touchup', _this.schdOnEnd);
            document.removeEventListener('touchcancel', _this.schdOnEnd);
            var removeItem = _this.props.removableByMove && _this.isDraggedItemOutOfBounds();
            if (!removeItem &&
                _this.props.transitionDuration > 0 &&
                _this.afterIndex !== -2) {
                // animate drop
                utils_1.schd(function () {
                    utils_1.setItemTransition(_this.ghostRef.current, _this.props.transitionDuration, 'cubic-bezier(.2,1,.1,1)');
                    if (_this.afterIndex < 1 && _this.state.itemDragged === 0) {
                        utils_1.transformItem(_this.ghostRef.current, 0, 0);
                    }
                    else {
                        utils_1.transformItem(_this.ghostRef.current, 
                        // compensate window scroll
                        -(window.pageYOffset - _this.lastYOffset) +
                            // compensate container scroll
                            -(_this.listRef.current.scrollTop - _this.lastListYOffset) +
                            (_this.state.itemDragged < _this.afterIndex
                                ? _this.itemTranslateOffsets
                                    .slice(_this.state.itemDragged + 1, _this.afterIndex + 1)
                                    .reduce(function (a, b) { return a + b; }, 0)
                                : _this.itemTranslateOffsets
                                    .slice(_this.afterIndex < 0 ? 0 : _this.afterIndex, _this.state.itemDragged)
                                    .reduce(function (a, b) { return a + b; }, 0) * -1), 0);
                    }
                })();
            }
            _this.dropTimeout = window.setTimeout(_this.finishDrop, removeItem || _this.afterIndex === -2 ? 0 : _this.props.transitionDuration);
        };
        _this.finishDrop = function () {
            var removeItem = _this.props.removableByMove && _this.isDraggedItemOutOfBounds();
            if (removeItem ||
                (_this.afterIndex > -2 && _this.state.itemDragged !== _this.afterIndex)) {
                _this.props.onChange({
                    oldIndex: _this.state.itemDragged,
                    newIndex: removeItem ? -1 : Math.max(_this.afterIndex, 0),
                    targetRect: _this.ghostRef.current.getBoundingClientRect()
                });
            }
            _this.getChildren().forEach(function (item) {
                utils_1.setItemTransition(item, 0);
                utils_1.transformItem(item, null);
            });
            _this.setState({ itemDragged: -1, scrollingSpeed: 0 });
            _this.afterIndex = -2;
            // sometimes the scroll gets messed up after the drop, fix:
            if (_this.lastScroll > 0) {
                _this.listRef.current.scrollTop = _this.lastScroll;
                _this.lastScroll = 0;
            }
        };
        _this.onKeyDown = function (e) {
            var selectedItem = _this.state.selectedItem;
            var index = _this.getTargetIndex(e);
            if (utils_1.checkIfInteractive(e.target, e.currentTarget)) {
                return;
            }
            if (index === -1)
                return;
            if (e.key === ' ') {
                e.preventDefault();
                if (selectedItem === index) {
                    if (selectedItem !== _this.needle) {
                        _this.getChildren().forEach(function (item) {
                            utils_1.setItemTransition(item, 0);
                            utils_1.transformItem(item, null);
                        });
                        _this.props.onChange({
                            oldIndex: selectedItem,
                            newIndex: _this.needle,
                            targetRect: _this.getChildren()[_this.needle].getBoundingClientRect()
                        });
                        _this.getChildren()[_this.needle].focus();
                    }
                    _this.setState({
                        selectedItem: -1,
                        liveText: _this.props.voiceover.dropped(selectedItem + 1, _this.needle + 1)
                    });
                    _this.needle = -1;
                }
                else {
                    _this.setState({
                        selectedItem: index,
                        liveText: _this.props.voiceover.lifted(index + 1)
                    });
                    _this.needle = index;
                    _this.calculateOffsets();
                }
            }
            if ((e.key === 'ArrowDown' || e.key === 'j') &&
                selectedItem > -1 &&
                _this.needle < _this.props.values.length - 1) {
                e.preventDefault();
                var offset = utils_1.getTranslateOffset(_this.getChildren()[selectedItem]);
                _this.needle++;
                _this.animateItems(_this.needle, selectedItem, offset, true);
                _this.setState({
                    liveText: _this.props.voiceover.moved(_this.needle + 1, false)
                });
            }
            if ((e.key === 'ArrowUp' || e.key === 'k') &&
                selectedItem > -1 &&
                _this.needle > 0) {
                e.preventDefault();
                var offset = utils_1.getTranslateOffset(_this.getChildren()[selectedItem]);
                _this.needle--;
                _this.animateItems(_this.needle, selectedItem, offset, true);
                _this.setState({
                    liveText: _this.props.voiceover.moved(_this.needle + 1, true)
                });
            }
            if (e.key === 'Escape' && selectedItem > -1) {
                _this.getChildren().forEach(function (item) {
                    utils_1.setItemTransition(item, 0);
                    utils_1.transformItem(item, null);
                });
                _this.setState({
                    selectedItem: -1,
                    liveText: _this.props.voiceover.canceled(selectedItem + 1)
                });
                _this.needle = -1;
            }
            if ((e.key === 'Tab' || e.key === 'Enter') && selectedItem > -1) {
                e.preventDefault();
            }
        };
        _this.schdOnMouseMove = utils_1.schd(_this.onMouseMove);
        _this.schdOnTouchMove = utils_1.schd(_this.onTouchMove);
        _this.schdOnEnd = utils_1.schd(_this.onEnd);
        return _this;
    }
    List.prototype.componentDidMount = function () {
        this.calculateOffsets();
        document.addEventListener('touchstart', this.onMouseOrTouchStart, {
            passive: false,
            capture: false
        });
        document.addEventListener('mousedown', this.onMouseOrTouchStart);
    };
    List.prototype.componentDidUpdate = function (_prevProps, prevState) {
        if (prevState.scrollingSpeed !== this.state.scrollingSpeed &&
            prevState.scrollingSpeed === 0) {
            this.doScrolling();
        }
    };
    List.prototype.componentWillUnmount = function () {
        document.removeEventListener('touchstart', this.onMouseOrTouchStart);
        document.removeEventListener('mousedown', this.onMouseOrTouchStart);
    };
    List.prototype.render = function () {
        var _this = this;
        var baseStyle = {
            userSelect: 'none',
            touchAction: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            boxSizing: 'border-box',
            position: 'relative'
        };
        var ghostStyle = __assign(__assign({}, baseStyle), { top: this.state.targetY, left: this.state.targetX, width: this.state.targetWidth, height: this.state.targetHeight, position: 'fixed', marginTop: 0 });
        return (React.createElement(React.Fragment, null,
            this.props.renderList({
                children: this.props.values.map(function (value, index) {
                    var isHidden = index === _this.state.itemDragged;
                    var isSelected = index === _this.state.selectedItem;
                    var isDisabled = 
                    // @ts-ignore
                    _this.props.values[index] && _this.props.values[index].disabled;
                    var props = {
                        key: index,
                        tabIndex: isDisabled ? -1 : 0,
                        'aria-roledescription': _this.props.voiceover.item(index + 1),
                        onKeyDown: _this.onKeyDown,
                        style: __assign(__assign({}, baseStyle), { visibility: isHidden ? 'hidden' : undefined, zIndex: isSelected ? 5000 : 0 })
                    };
                    return _this.props.renderItem({
                        value: value,
                        props: props,
                        index: index,
                        isDragged: false,
                        isSelected: isSelected,
                        isOutOfBounds: false
                    });
                }),
                isDragged: this.state.itemDragged > -1,
                props: {
                    ref: this.listRef
                }
            }),
            this.state.itemDragged > -1 &&
                ReactDOM.createPortal(this.props.renderItem({
                    value: this.props.values[this.state.itemDragged],
                    props: {
                        ref: this.ghostRef,
                        style: ghostStyle,
                        onWheel: this.onWheel
                    },
                    index: this.state.itemDragged,
                    isDragged: true,
                    isSelected: false,
                    isOutOfBounds: this.state.itemDraggedOutOfBounds > -1
                }), this.props.container || document.body),
            React.createElement("div", { "aria-live": "assertive", role: "log", "aria-atomic": "true", style: {
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    margin: '-1px',
                    border: '0px',
                    padding: '0px',
                    overflow: 'hidden',
                    clip: 'rect(0px, 0px, 0px, 0px)',
                    clipPath: 'inset(100%)'
                } }, this.state.liveText)));
    };
    List.defaultProps = {
        transitionDuration: 300,
        lockVertically: false,
        removableByMove: false,
        voiceover: {
            item: function (position) {
                return "You are currently at a draggable item at position " + position + ". Press space bar to lift.";
            },
            lifted: function (position) {
                return "You have lifted item at position " + position + ". Press j to move down, k to move up, space bar to drop and escape to cancel.";
            },
            moved: function (position, up) {
                return "You have moved the lifted item " + (up ? 'up' : 'down') + " to position " + position + ". Press j to move down, k to move up, space bar to drop and escape to cancel.";
            },
            dropped: function (from, to) {
                return "You have dropped the item. It has moved from position " + from + " to " + to + ".";
            },
            canceled: function (position) {
                return "You have cancelled the movement. The item has returned to its starting position of " + position + ".";
            }
        }
    };
    return List;
}(React.Component));
exports.default = List;