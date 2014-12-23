define(function() {
  'use strict';

  return {
    _toDoList: {},
    createPixiObject: function() {},
    updateAttributes: function() {},
    createRenderObject: function(message) {
      return {
        id: message.id,
        type: message.type,
        parent: message.parent,
        pixiObject: this.createPixiObject()
      };
    },
    remove: function(renderObject, stage) {
      stage.removeChild(renderObject.pixiObject);
    },
    updateParent: function(message, renderObjects) {
      if (message.parent == null) return;
      var renderObject = renderObjects[message.id];
      var renderParentObject = renderObjects[message.parent];
      // Handle case where parent doesn't exist yet
      if (renderParentObject == null) {
        this._toDoList[message.parent] = function() {
          this.updateParent(message, renderObjects);
        }.bind(this);
      } else {
        renderParentObject.pixiObject.addChild(renderObject.pixiObject);
      }
    },
    updateGeometry: function(message, renderObjects) {
      var matrix = message.attributes.matrix;
      if (matrix == null) return;
      var pixiObject = renderObjects[message.id].pixiObject;
      pixiObject.worldTransform.a = matrix.a;
      pixiObject.worldTransform.b = matrix.b;
      pixiObject.worldTransform.c = matrix.c;
      pixiObject.worldTransform.d = matrix.d;
      pixiObject.worldTransform.tx = matrix.tx;
      pixiObject.worldTransform.ty = matrix.ty;
    },
    processToDoList: function(message) {
      if (message.id in this._toDoList) {
        this._toDoList[message.id]();
        delete this._toDoList[message.id];
      }
    }
  };

});
