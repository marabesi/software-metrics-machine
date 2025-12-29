import panel as pn

from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)


def configuration_section(configuration: Configuration):

    def form_section():
        fields = []

        for key, value in configuration.__dict__.items():
            if key == "github_token":
                field = pn.widgets.PasswordInput(
                    name="GitHub Token",
                    placeholder="",
                    value=value,
                )
                fields.append(field)
                continue
            field = pn.widgets.TextAreaInput(
                name=key.replace("_", " ").capitalize(),
                placeholder="",
                value=str(value if value is not None else ""),
                rows=2,
                auto_grow=True,
                max_rows=5,
            )
            fields.append(field)

        return pn.Column(*fields)

    return pn.Column(
        "## Configuration",
        pn.Row(form_section()),
    )
