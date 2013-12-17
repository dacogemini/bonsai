define([
  'bdd',
  'expect',
  'sinon',
  'bonsai/vendor/glmatrix/mat2d',
  'bonsai/runner/DisplayObject'
], function(bdd, expect, sinon, mat2d, DisplayObject) {
  'use strict';

  var beforeEach = bdd.beforeEach, describe = bdd.describe, it = bdd.it;
  var xit = bdd.xit;

  describe('DisplayObject', function() {
    var displayObject, attributeCache;
    beforeEach(function() {
      displayObject = new DisplayObject();
    });

    describe('Attribute system:', function() {
      function setAttributes(attributes) {
        displayObject = new DisplayObject(attributes);
      }

      it('gets an existing attribute', function() {
        setAttributes({arbitrary: 1234});
        expect(displayObject.attr('arbitrary')).to.equal(1234);
      });

      it('sets an existing attribute', function() {
        setAttributes({arbitrary: undefined});
        displayObject.attr('arbitrary', 1234);
        expect(displayObject.attr('arbitrary')).to.equal(1234);
      });

      it('returns the display object when setting', function() {
        expect(displayObject.attr('arbitrary', 1234)).to.equal(displayObject);
      });

      it('does not set non-existant attributes', function() {
        setAttributes({});
        displayObject.attr('arbitrary', 1234);
        expect(displayObject.attr('arbitrary')).to.equal(undefined);
      });

      it('returns the value of existing getters', function() {
        setAttributes({
          arbitrary: 1234,
          get_arbitrary: function() { return 5678; }
        });
        expect(displayObject.attr('arbitrary')).to.equal(5678);
      });

      it('uses the return value of existing setters to set the value of the attribute', function() {
        setAttributes({
          arbitrary: undefined,
          set_arbitrary: function() { return 1234; }
        });
        displayObject.attr('arbitrary', 5678);
        expect(displayObject.attr('arbitrary')).to.equal(1234);
      });

      it('invokes setters without assigning the value if the attribute name does not exist', function() {
        var setArbitrary = sinon.spy(function() {
          return 5678;
        });
        setAttributes({
          set_arbitrary: setArbitrary
        });
        displayObject.attr('arbitrary', 1234);

        expect(setArbitrary).to.have.been.called;
        expect(displayObject.attr('arbitrary')).to.equal(undefined);
      });

      it('passes the current value and an attribute cache to getters', function() {
        var getArbitrary = sinon.spy();
        setAttributes({
          arbitrary: 1234,
          get_arbitrary: getArbitrary
        });

        displayObject.attr('arbitrary');
        expect(getArbitrary).to.have.been.calledWith(1234, {});
      });

      it('passes the new value, the old value, and an attribute cache to setters', function() {
        var setArbitrary = sinon.spy();
        setAttributes({
          arbitrary: 1234,
          set_arbitrary: setArbitrary
        });

        displayObject.attr('arbitrary', 5678);
        expect(setArbitrary).to.have.been.calledWith(5678, 1234, {});
      });

      it('calls all setters and getters with the same attribute cache', function() {
        var cacheObjects = [];
        setAttributes({
          get_foo: function(_, cache) {
            cache.get_foo = true;
            cacheObjects.push(cache);
          },

          get_bar: function(_, cache) {
            cache.get_bar = true;
            cacheObjects.push(cache);
          },

          set_bar: function(_, __, cache) {
            cache.set_bar = true;
            cacheObjects.push(cache);
          }
        });

        displayObject.attr('foo');
        displayObject.attr('bar');
        displayObject.attr('bar', 'arbitrary');

        expect(cacheObjects[1])
          .to.equal(cacheObjects[0]);
        expect(cacheObjects[2])
          .to.equal(cacheObjects[0]);
      });

      it('updates attributes from a passed-in object as single parameter', function() {
        setAttributes({
          foo: undefined,
          bar: undefined,
          set_bar: function(value) { return value + 2; },
          baz: undefined,
          set_bazoong: function(value) { this.baz = value; }
        });

        displayObject.attr({
          foo: 1,
          bar: 2,
          bazoong: 3
        });

        var expected = {
          foo: 1,
          bar: 4,
          baz: 3
        };

        for (var key in expected) {
          expect(displayObject.attr(key))
            .to.equal(expected[key]);
        }
      });
    });

    describe('Core attributes:', function() {
      describe('opacity:', function() {
        it('defaults to 1', function() {
          expect(displayObject.attr('opacity')).to.equal(1);
        });
        it('setter passes through 0', function() {
          displayObject.attr('opacity', 0);
          expect(displayObject.attr('opacity'))
            .to.equal(0);
        });

        it('setter passes through 1', function() {
          displayObject.attr('opacity', 1);
          expect(displayObject.attr('opacity'))
            .to.equal(1);
        });

        it('setter passes through .7', function() {
          displayObject.attr('opacity', 0.7);
          expect(displayObject.attr('opacity'))
            .to.equal(0.7);
        });

        it('setter returns 0 for values < 0', function() {
          displayObject.attr('opacity', -1.2);
          expect(displayObject.attr('opacity'))
            .to.equal(0);
        });

        it('setter returns 1 for values > 1', function() {
          displayObject.attr('opacity', 123);
          expect(displayObject.attr('opacity'))
            .to.equal(1);
        });
      });

      describe('skew:', function() {
        it('defaults to 0', function() {
          expect(displayObject.attr('skew'))
            .to.equal(0);
        });

        it('can be set', function() {
          var skew = 1.23;
          displayObject.attr('skew', skew);

          expect(displayObject.attr('skew'))
            .to.equal(skew);
        });

        it('is reflected by the `transform` attribute', function() {
          var skew = 1.23;
          displayObject.attr('skew', skew);
          expect(displayObject.attr('transform')).
            to.deep.equal([1, 0, skew, 1, 0, 0]);
        });
      });

      describe('scale:', function() {
        it('defaults to 1 for both axes', function() {
          testScale(1, 1);
        });

        it('can be set', function() {
          var scaleX = 1.23, scaleY = 4.56;
          displayObject.attr({scaleX: scaleX, scaleY: scaleY});

          testScale(scaleX, scaleY);
        });

        it('is reflected by the `transform` attribute', function() {
          var scaleX = 1.23, scaleY = 4.56;
          displayObject.attr({scaleX: scaleX, scaleY: scaleY});
          expect(displayObject.attr('transform')).
            to.deep.equal([scaleX, 0, 0, scaleY, 0, 0]);
        });

        it('can set both scales with the `scale` setter', function() {
          var scale = 54.3;
          displayObject.attr('scale', scale);

          testScale(scale, scale);
        });

        it('can get both scales', function() {
          var scale = 1.23;
          displayObject.attr('scale', scale);

          expect(displayObject.attr('scale'))
            .to.equal(scale);
        });

        it('returns `undefined` for `scale` when x and y scales are different', function() {
          displayObject.attr({scaleX: 2, scaleY: 3});

          expect(displayObject.attr('scale'))
            .to.equal(undefined);
        });

        it('reflects `scale` in the `transform` attribute', function() {
          var scale = 1.23;
          displayObject.attr('scale', scale);

          expect(displayObject.attr('transform')).
            to.deep.equal([scale, 0, 0, scale, 0, 0]);
        });

        function testScale(x, y) {
          expect(displayObject.attr('scaleX'))
            .to.equal(x);
          expect(displayObject.attr('scaleY'))
            .to.equal(y);
        }
      });

      describe('rotation:', function() {
        it('defaults to 0', function() {
          expect(displayObject.attr('rotation'))
            .to.equal(0);
        });

        it('passes through 0', function() {
          testPassthrough(0);
        });

        it('passes through 1', function() {
          testPassthrough(1);
        });

        it('passes through values smaller 2 * PI', function() {
          testPassthrough(6.283185307179585);
        });

        it('normalizes 2*PI to 0', function() {
          testRotation(2 * Math.PI, 0);
        });

        it('normalizes negative values to the range [0, 2 * PI)', function() {
          testRotation(-2.5 * Math.PI, 1.5 * Math.PI);
        });

        it('setter normalizes values > 2*PI to the range [0, 2*PI)', function() {
          testRotation(4 * Math.PI + 0.5, 0.5);
        });

        it('is reflected on the transform attribute', function() {
          var angle = 3/4 * Math.PI;
          displayObject.attr('rotation', angle);

          testTransform(displayObject.attr('transform'), rotateMatrix(identityMatrix(), angle));
        });

        it('can parse degrees', function() {
          testRotation('45deg', Math.PI / 4);
        });

        it('can parse turns', function() {
          testRotation('1.25turn', Math.PI * .5);
        });

        it('can parse radians', function() {
          testRotation('-.5rad', 2 * Math.PI - 0.5);
        });

        it('can parse gradians', function() {
          testRotation('-200grad', Math.PI);
        });

        function testRotation(angle, expected) {
          displayObject.attr('rotation', angle);

          expect(displayObject.attr('rotation'))
            .to.equal(expected);
        }
        function testPassthrough(angle) {
          testRotation(angle, angle);
        }
      });

      describe('translation:', function() {
        it('default to 0 for both axes', function() {
          testTranslation(0, 0);
        });

        it('is settable', function() {
          var x = 12.3, y = -45.67;
          displayObject.attr({x: x, y: y});

          testTranslation(x, y);
        });

        it('is reflected by the `transform` attribute', function() {
          var x = 12.3, y = -45.67;
          displayObject.attr({x: x, y: y});

          testTransform(displayObject.attr('transform'), [1, 0, 0, 1, x, y]);
        });

        function testTranslation(x, y) {
          expect(displayObject.attr('x'))
            .to.equal(x);
          expect(displayObject.attr('y'))
            .to.equal(y);
        }
      });

      describe('transform:', function() {
        it('defaults to `null`', function() {
          expect(displayObject.attr('transform'))
            .to.equal(null);
        });

        it('copies the value if uninitialized', function() {
          var value = [1, 2, 3, 4, 5, 6];
          displayObject.attr('transform', value);
          var transform = displayObject.attr('transform');

          testTransform(transform, value);

          expect(transform)
            .not.to.equal(value);
        });

        it('updates the existing attribute value', function() {
          var value = [1, 2, 3, 4, 5, 6];
          displayObject.attr('transform', identityMatrix());
          var transform = displayObject.attr('transform');

          displayObject.attr('transform', value);

          testTransform(displayObject.attr('transform'), value);

          expect(displayObject.attr('transform'))
            .to.equal(transform);
        });

        it('is computed applying skew, scale, rotation and translation in this order', function() {
          var skew = 0.5, rotation = 2, x = -200, y = 123, scaleX = 4, scaleY = -0.5;

          // intentionally apply in different order
          displayObject.attr('rotation', rotation);
          displayObject.attr({x: x, y: y});
          displayObject.attr({scaleX: scaleX, scaleY: scaleY});
          displayObject.attr('skew', skew);

          testTransform(displayObject.attr('transform'), expectedTransform({
            skew: skew,
            rotation: rotation,
            scaleX: scaleX,
            scaleY: scaleY,
            x: x,
            y: y
          }));
        });

        it('extracts translation, rotation, scale and skew correctly', function() {
          var scaleX = 1.5, scaleY = 3.45, skew = .777;
          var rotation = Math.PI * 1.23, x = 98, y = -67;

          var transform = [1, 0, skew, 1, 0, 0];
          scaleMatrix(transform, scaleX, scaleY);
          rotateMatrix(transform, rotation);
          translateMatrix(transform, x, y);

          displayObject.attr('transform', transform);

          expect(displayObject.attr('scaleX'))
            .to.be.closeTo(scaleX, 1e-12);
          expect(displayObject.attr('scaleY'))
            .to.be.closeTo(scaleY, 1e-12);
          expect(displayObject.attr('skew'))
            .to.be.closeTo(skew, 1e-12);
          expect(displayObject.attr('rotation'))
            .to.be.closeTo(rotation, 1e-12);
          expect(displayObject.attr('x'))
            .to.be.closeTo(x, 1e-12);
          expect(displayObject.attr('y'))
            .to.be.closeTo(y, 1e-12);
        });

        describe('transform origin:', function() {
          it('has a `transformOriginX` attribute with 0 as default value', function() {
            expect(displayObject.attr('transformOriginX'))
              .to.equal(0);
          });

          it('has a `transformOriginY` attribute with 0 as default value', function() {
            expect(displayObject.attr('transformOriginY'))
              .to.equal(0);
          });

          it('can set both transform origin axes via `transformOrigin`', function() {
            displayObject.attr('transformOrigin', [20, -40]);

            expect(displayObject.attr('transformOriginX'))
              .to.equal(20);
            expect(displayObject.attr('transformOriginY'))
              .to.equal(-40);
          });

          it('should reflect the transform origin in the `transform` attribute', function() {
            var originX = 30, originY = -40, angle = Math.PI;
            displayObject.attr('rotation', angle);
            displayObject.attr('transform'); // make sure transform is calculated here

            displayObject.attr({
              transformOriginX: originX,
              transformOriginY: originY
            });

            testTransform(displayObject.attr('transform'), expectedTransform({
              originX: originX,
              originY: originY,
              rotation: angle
            }));
          });

          it('should reflect the transform origin in the `transform` attribute when set with `transformOrigin`', function() {
            var originX = 30, originY = -40, angle = Math.PI;
            displayObject.attr('rotation', angle);
            displayObject.attr('transform'); // make sure transform is calculated here

            displayObject.attr('transformOrigin', [originX, originY]);

            testTransform(displayObject.attr('transform'), expectedTransform({
              originX: originX,
              originY: originY,
              rotation: angle
            }));
          });

          it('uses the transform origin correctly in a complex transformation', function() {
            var skew = 0.5, rotation = 2, x = -200, y = 123, scaleX = 4, scaleY = -0.5;
            var originX = -12.3, originY = 98;

            // intentionally apply in different order
            displayObject.attr('rotation', rotation);
            displayObject.attr({x: x, y: y});
            displayObject.attr({transformOriginX: originX, transformOriginY: originY});
            displayObject.attr({scaleX: scaleX, scaleY: scaleY});
            displayObject.attr('skew', skew);

            testTransform(displayObject.attr('transform'), expectedTransform({
              skew: skew,
              rotation: rotation,
              scaleX: scaleX,
              scaleY: scaleY,
              originX: originX,
              originY: originY,
              x: x,
              y: y
            }));
          });

          it('extracts translation, rotation, scale and skew using the transform origin', function() {
            var skew = 0.5, rotation = 2, x = -200, y = 123, scaleX = 4, scaleY = -0.5;
            var originX = -12.3, originY = 98;

            displayObject.attr('transformOrigin', [originX, originY]);
            displayObject.attr('transform', [
              -1.6645873461885696,
              3.637189707302727,
              -0.37764495968144396,
              2.0266682719249345,
              -277.3299982725778,
              245.34623840901355
            ]);

            expect(displayObject.attr('scaleX'))
              .to.be.closeTo(scaleX, 1e-12);
            expect(displayObject.attr('scaleY'))
              .to.be.closeTo(scaleY, 1e-12);
            expect(displayObject.attr('skew'))
              .to.be.closeTo(skew, 1e-12);
            expect(displayObject.attr('rotation'))
              .to.be.closeTo(rotation, 1e-12);
            expect(displayObject.attr('x'))
              .to.be.closeTo(x, 1e-12);
            expect(displayObject.attr('y'))
              .to.be.closeTo(y, 1e-12);
          });
        });
      });

      function testTransform(transform, expected) {
        normalizeTransform(transform);
        normalizeTransform(expected);

        expect(transform).to.deep.equal(expected);
      }

      function normalizeTransform(matrix) {
        // this fixes the fixation of chai.js that +0 !== -0
        matrix.forEach(function(value, i, matrix) {
          if (value === -0) matrix[i] = 0; // ensure we have no negative zero
        });
      }

      function identityMatrix() {
        return [1, 0, 0, 1, 0, 0];
      }

      function rotateMatrix(matrix, angle) {
        return mat2d.rotate(matrix, matrix, -angle); // mat2d rotates counter-clockwisde;
      }

      function translateMatrix(matrix, x, y) {
        return mat2d.translate(matrix, matrix, [x, y]);
      }

      function scaleMatrix(matrix, x, y) {
        return mat2d.scale(matrix, matrix, [x, y]);
      }

      function expectedTransform(options) {
        function v(name, fallback) {
          return options[name] || fallback || 0;
        }

        var transform = identityMatrix();
        transform[2] = v('skew');
        translateMatrix(transform, -v('originX'), -v('originY'));
        scaleMatrix(transform, v('scaleX', 1), v('scaleY', 1));
        rotateMatrix(transform, v('rotation'));
        translateMatrix(transform, v('x') + v('originX'), v('y') + v('originY'));
        return transform;
      }
    });
  });
});