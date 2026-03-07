<p align="center">
	<b>puchitto (プチッと)</b><br>
	<span>adj. (japanese loan from french) - petit</span>
</p>

<hr>

A tiny framework for building interactive multiplayer 3D websites. This is the client equivalent to [Puchitto.Server](https://github.com/purifetchi/Puchitto.Server).

## Why?

While I was building my personal website (prefetcher.net), I started working on a thin framework on top of THREE.js that could support building multiplayer worlds, with easy level bundling and extending. It grew a bit in scope, so I've decided to split it into its own thing.

It's very much tailor-built to fit my own needs, but I thought some people might benefit from it too, so here's that.

## Features

- Full client/server architecture over WebSockets, with the server-side written in C#.
- Ability to define own objects and packets by extending the base Game class.
- Loading and reconstructing levels from ALF (Agiriko Lump Format) bundle files.
- Tiny LISP-based scripting language (called MiniAntics) for scripting interactions within the level.
- An event stream for most framework-related happenings, like loading or object creation.
- Tweening.

## How to start?

You can create your own project by extending the abstract `Game` class. Custom entities can then be defined within the `registerCustomEntities` method, whilst custom packets can be registered by extending the `registerCustomPacketHandlers` method.

An example game can be seen below:

```ts
import { Game } from 'puchitto'

export default class PrefetcherGame extends Game {
    protected registerCustomEntities(factory: EntityFactory): void {
        factory.registerEntity<AtaObject>("ata", AtaObject)
    }

    protected registerCustomEventStreamHandlers(): void {
        this.eventStream.on("loading", (percent) => {
            console.log(`${percent * 100}%...`)
        })
    }

    protected registerCustomPacketHandlers(): void {
        this._networkManager.addPacketHandler(PrefetcherPacketTypes.MOVE_ATA, async (nr, game) => {
            const packet = readMoveAtaPacket(nr)
            
            const entity = game.getObjectById(packet.id) as AtaObject
            if (entity === undefined) {
                return
            }

            entity.doMove(packet.to)
        }) 
    }
}
```

To then create an instance of the game, you instantiate a new object of your game class, and call run on it. You must also pass the address of the server, and the element where the THREE.js renderer will bind.

```ts
import PrefetcherGame from "./prefetcherGame";
 
const game = new PrefetcherGame()
game.run({
    element: document.getElementById("game")!,
    server: "http://localhost:8080/"
})
```

The game will then autoconnect to the server and fetch the currently present level to load into it.

## Contributing

If you'd really want to contribute to this project (thank you!) please adhere to the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) commit format as much as you can.
