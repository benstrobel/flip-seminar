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
} from "@mantine/core";
import { Heart, X } from "tabler-icons-react";

interface SwiperProps {
  imageUrl: string;
  style: Style;
  sampleCallback: (style: Style, pos: boolean) => void;
  loading?: boolean;
  onLoad?: () => void;
}

export default function Swiper({
  imageUrl,
  style,
  sampleCallback,
  loading = false,
  onLoad,
}: SwiperProps) {
  return (
    <Stack>
      <Center>
        <Text size={"lg"}>Would you wear/use this fashion product?</Text>
      </Center>
      <Card shadow="sm" radius={"md"} withBorder>
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
          <Group style={{ width: "40%", marginTop: "15px" }} position="apart">
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
      </Card>
    </Stack>
  );
}
