import { skillCategories } from "@skilltego/config";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@skilltego/ui";
import { FadeIn } from "./fade-in";

export function CategoriesShowcase() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Skills across every domain</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            From code to choreography — if it&apos;s a skill, it belongs on Skilltego.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skillCategories.map((category, i) => (
            <FadeIn key={category.slug} delay={i * 0.05}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {category.subcategories.slice(0, 5).map((sub) => (
                    <Badge key={sub} variant="outline">
                      {sub}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
