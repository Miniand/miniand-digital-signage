(function(global) {
  angular.module('stadiumDirectives', [])
  .directive('matchesLive2d', function() {
    return {
      scope: {
        matchId: '@'
      },
      templateUrl: '/partials/matches/live-2d.html'
    };
  });
}(this));