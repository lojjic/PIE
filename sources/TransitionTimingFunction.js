PIE.TransitionTimingFunction = {

    /**
     * Cubic bezier easing utility by Gaëtan Renaudeau, originally "KeySpline.js", used with
     * permission of the author. From the writeup at:
     * http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
     *
     * Modified to be a factory that returns a Function, and to make the internal utility
     * functions shared across instances.
     *
     * @param {Number} x1
     * @param {Number} y1
     * @param {Number} x2
     * @param {Number} y2
     * @return Function
     */
    getCubicBezierTimingFunction: (function() {
        function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
        function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
        function C(aA1) { return 3.0 * aA1; }

        // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
        function CalcBezier(aT, aA1, aA2) {
            return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
        }

        // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
        function GetSlope(aT, aA1, aA2) {
            return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
        }

        function GetTForX(aX, mX1, mX2) {
            // Newton raphson iteration
            var aGuessT = aX,
                i = 0,
                currentSlope, currentX;
            for (; i < 4; ++i) {
                currentSlope = GetSlope(aGuessT, mX1, mX2);
                if (currentSlope == 0.0) return aGuessT;
                currentX = CalcBezier(aGuessT, mX1, mX2) - aX;
                aGuessT -= currentX / currentSlope;
            }
            return aGuessT;
        }

        return function(mX1, mY1, mX2, mY2) {
            return function(time) {
                if (mX1 == mY1 && mX2 == mY2) return time; // linear
                return CalcBezier(GetTForX(time, mX1, mX2), mY1, mY2);
            };
        }
    })(),

    /**
     * Stepping function - see http://www.w3.org/TR/css3-transitions/#transition-timing-function-property
     * @param numSteps The number of steps in the transition
     * @param changeAt Whether the step up occurs at the 'start' or 'end' of each step interval. Defaults to 'end'.
     * @return Function
     */
    getStepsTimingFunction: function(numSteps, changeAt) {
        return function(time) {
            return Math[ changeAt === 'start' ? 'ceil' : 'floor' ]( time * numSteps ) / numSteps;
        };
    }
};


PIE.TransitionTimingFunction.namedEasings = {
    'ease': PIE.TransitionTimingFunction.getCubicBezierTimingFunction( 0.25, 0.1, 0.25, 1 ),
    'linear': PIE.TransitionTimingFunction.getCubicBezierTimingFunction( 0, 0, 1, 1 ),
    'ease-in': PIE.TransitionTimingFunction.getCubicBezierTimingFunction( 0.42, 0, 1, 1 ),
    'ease-out': PIE.TransitionTimingFunction.getCubicBezierTimingFunction( 0, 0, 0.58, 1 ),
    'ease-in-out': PIE.TransitionTimingFunction.getCubicBezierTimingFunction( 0.42, 0, 0.58, 1 ),
    'step-start': PIE.TransitionTimingFunction.getStepsTimingFunction( 1, 'start' ),
    'step-end': PIE.TransitionTimingFunction.getStepsTimingFunction( 1, 'end' )
};


