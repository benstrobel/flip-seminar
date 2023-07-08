import { Style } from "@/lib/learning";
import {
  Card,
  Stack,
  Image,
  Group,
  Text,
  ActionIcon,
  Center,
  LoadingOverlay,
  Transition,
  MantineTransition,
  Container,
} from "@mantine/core";
import { Heart, X } from "tabler-icons-react";

interface SwiperProps {
  imageUrl: string;
  style: Style;
  sampleCallback: (style: Style, pos: boolean) => void;
  loading?: boolean;
  onLoad?: () => void;
  transitionState: TransitionState;
}


export interface TransitionState {
  transition: MantineTransition;
  mounted: boolean;
}

export default function Swiper({
  imageUrl,
  style,
  sampleCallback,
  loading = false,
  transitionState,
  onLoad,
}: SwiperProps) {
  return (
    <Stack>
      <Center>
        <Text size={"lg"}>Would you wear/use this fashion product?</Text>
      </Center>
      <Container style={{minHeight: "43vh"}}>
        <Transition mounted={transitionState.mounted} transition={transitionState.transition} keepMounted>
          {(styles) => <Card shadow="sm" radius={"md"} withBorder style={styles}>
            <Card.Section style={{ position: "relative" }}>
              <Image
                src={imageUrl}
                height={"40vh"}
                onLoad={onLoad}
                alt={style.productDisplayName}
                style={{ minHeight: "40vh", minWidth: "30vh" }}
              />
              <LoadingOverlay visible={loading} color="green" />
            </Card.Section>
            <Group position="center" style={{}}>
              <Group style={{ width: "70%", marginTop: "15px" }} position="apart">
                <ActionIcon
                  style={{ backgroundColor: "#101113" }}
                  radius={"xl"}
                  size={"xl"}
                  onClick={() => {
                    sampleCallback(style, false);
                  }}
                  disabled={loading}
                >
                  <X color="red" />
                </ActionIcon>
                <ActionIcon
                  style={{ backgroundColor: "#101113" }}
                  radius={"xl"}
                  size={"xl"}
                  onClick={() => {
                    sampleCallback(style, true);
                  }}
                  disabled={loading}
                >
                  <Heart color="green" />
                </ActionIcon>
              </Group>
            </Group>
          </Card>}
        </Transition>
      </Container>
    </Stack>
  );
}
