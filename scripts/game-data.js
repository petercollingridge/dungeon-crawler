const TILE_SIZE = 36;
const PLAYER_SIZE = TILE_SIZE * 0.44;

const dungeonMap = [
  '      ########################',
  '                             #',
  '      #                      #',
  '      ###################### #',
  '      #                      #',
  '      # #*       ########### #',
  '      #          #         # #',
  '#######      #   #         # #',
  '    @           #         # #',
  '                 #         # #',
  '#######  #       #         # #',
  '      #          #         # #',
  '      #   1      # ####### # #',
  '      #          #       #   #',
  '      ######  ########## #####',
  '           #  #        #     #',
  '           #  #        ##### #',
  '           #  #            # #',
  '           #  #            # #',
  '############  #######      # #',
  '#                   #      # #',
  '#     # # # # #     #      # #',
  '#     # # # # #   # #      # #',
  '#                   #      # #',
  '#                   ######## #',
  '#         ####               #',
  '#               ############ #',
  '#               #          # #',
  '#################          # #',
  '      #       #              #',
  '      #       #              #',
  '      #       #              #',
  '      #                      #',
  '      #                      #',
  '      ########################',
];

const STATS = {
  player: {
    health: 20,
    speed: 3,
    attack: 5,
    defend: 4,
    xp: 0,
    gold: 0,
  },
  goblin: {
    speed: 4,
    health: 3,
    attack: 3,
    defend: 1,
  },
};
