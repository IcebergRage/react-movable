"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function arrayMove(array, from, to) {
    array = array.slice();
    array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
    return array;
}
exports.arrayMove = arrayMove;
function arrayRemove(array, index) {
    array = array.slice();
    array.splice(index, 1);
    return array;
}
exports.arrayRemove = arrayRemove;
function getTranslateOffset(element) {
    var style = window.getComputedStyle(element);
    return (Math.max(parseInt(style['margin-top'], 10), parseInt(style['margin-bottom'], 10)) + element.getBoundingClientRect().height);
}
exports.getTranslateOffset = getTranslateOffset;
function isTouchEvent(event) {
    return ((event.touches && event.touches.length) ||
        (event.changedTouches && event.changedTouches.length));
}
exports.isTouchEvent = isTouchEvent;
function transformItem(element, offsetY, offsetX) {
    if (offsetY === void 0) { offsetY = 0; }
    if (offsetX === void 0) { offsetX = 0; }
    if (!element)
        return;
    if (offsetY === null || offsetX === null) {
        element.style.removeProperty('transform');
        return;
    }
    element.style.transform = "translate(" + offsetX + "px, " + offsetY + "px)";
}
exports.transformItem = transformItem;
function isItemTransformed(element) {
    return !!element.style.transform;
}
exports.isItemTransformed = isItemTransformed;
function setItemTransition(element, duration, timing) {
    if (element) {
        element.style['transition'] = "transform " + duration + "ms" + (timing ? " " + timing : '');
    }
}
exports.setItemTransition = setItemTransition;
// returns the "slot" for the targetValue, aka where it should go
// in an ordered "array", it starts with -1 index
function binarySearch(array, targetValue) {
    var min = 0;
    var max = array.length - 1;
    var guess;
    while (min <= max) {
        guess = Math.floor((max + min) / 2);
        if (!array[guess + 1] ||
            (array[guess] <= targetValue && array[guess + 1] >= targetValue)) {
            return guess;
        }
        else if (array[guess] < targetValue && array[guess + 1] < targetValue) {
            min = guess + 1;
        }
        else {
            max = guess - 1;
        }
    }
    return -1;
}
exports.binarySearch = binarySearch;
// adapted from https://github.com/alexreardon/raf-schd
exports.schd = function (fn) {
    var lastArgs = [];
    var frameId = null;
    var wrapperFn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        lastArgs = args;
        if (frameId) {
            return;
        }
        frameId = requestAnimationFrame(function () {
            frameId = null;
            fn.apply(void 0, lastArgs);
        });
    };
    return wrapperFn;
};
function checkIfInteractive(target, rootElement) {
    var DISABLED_ELEMENTS = [
        'input',
        'textarea',
        'select',
        'option',
        'optgroup',
        'video',
        'audio',
        'button',
        'a'
    ];
    var DISABLED_ROLES = ['button', 'link', 'checkbox', 'tab'];
    while (target !== rootElement) {
        if (target.getAttribute('data-movable-handle')) {
            return false;
        }
        if (DISABLED_ELEMENTS.includes(target.tagName.toLowerCase())) {
            return true;
        }
        var role = target.getAttribute('role');
        if (role && DISABLED_ROLES.includes(role.toLowerCase())) {
            return true;
        }
        if (target.tagName.toLowerCase() === 'label' &&
            target.hasAttribute('for')) {
            return true;
        }
        if (target.tagName)
            target = target.parentElement;
    }
    return false;
}
exports.checkIfInteractive = checkIfInteractive;