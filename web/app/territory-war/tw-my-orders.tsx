import Link from "next/link";
import type { MyOrders } from "@/lib/tw-my-orders";

/** The member's own job for the war, or a plain "nothing yet". */
export default function TwMyOrders({ orders, planPosted }: { orders: MyOrders | null; planPosted: boolean }) {
  const hasOrders = orders && (orders.defence.length || orders.attack.length);
  return (
    <section className="tw-my-orders" id="my-orders" aria-labelledby="my-orders-heading">
      <p className="eyebrow">Your job this war</p>
      <h2 id="my-orders-heading">{hasOrders ? "Here is what you are asked to do" : planPosted ? "No orders for you this war" : "No orders posted yet"}</h2>
      {hasOrders ? (
        <div className="tw-order-list">
          {orders.defence.map((order) => (
            <article key={`d-${order.zone}-${order.squad}`} className={order.placed ? "is-done" : undefined}>
              <span className="tw-order-kind">Defend</span>
              <strong>{order.squad}</strong>
              <small>{order.zone}{order.placed ? " · placed" : ""}</small>
              {order.note ? <p>{order.note}</p> : null}
            </article>
          ))}
          {orders.attack.map((order) => (
            <article key={`a-${order.zone}-${order.enemySquad ?? "tbc"}`} className={order.cleared ? "is-done" : undefined}>
              <span className="tw-order-kind is-attack">Attack</span>
              <strong>{order.enemySquad ?? "Enemy squad to be confirmed"}</strong>
              <small>{order.zone}{order.cleared ? " · cleared" : ""}</small>
              {order.note ? <p>{order.note}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="tw-order-empty">
          {planPosted
            ? "The officers have posted the plan and you are not in it, so you are free to go where you are needed."
            : "When a war starts the officers post everyone's job here, so you see only yours."}
        </p>
      )}
      <div className="tw-order-links">
        <Link href="/counters">Find a counter →</Link>
        <Link href="/guides#territory-war-orders">How TW works →</Link>
      </div>
    </section>
  );
}
